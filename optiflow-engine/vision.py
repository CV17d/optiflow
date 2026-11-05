import cv2
import logging
import math
import threading
import time
from collections import deque
import mediapipe as mp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Índices canónicos de MediaPipe Face Mesh para EAR
# [p1 (comisura ext), p2 (sup 1), p3 (sup 2), p4 (comisura int), p5 (inf 2), p6 (inf 1)]
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

# Umbral anatómico para parpadeo real (ojo cerrado suele ser < 0.15)
EAR_THRESHOLD = 0.17

# Ventana deslizante reducida a 15 segundos para eliminar rápidamente ráfagas de parpadeo pasadas
BPM_WINDOW_SECONDS = 15.0


def euclidean_dist(p1: tuple, p2: tuple) -> float:
    """Calcula la distancia euclidiana entre dos puntos 2D."""
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


def calculate_ear(eye_points: list) -> float:
    """
    Calcula el Eye Aspect Ratio (EAR):
    EAR = (|p2 - p6| + |p3 - p5|) / (2 * |p1 - p4|)
    """
    if len(eye_points) < 6:
        return 0.0

    v1 = euclidean_dist(eye_points[1], eye_points[5])
    v2 = euclidean_dist(eye_points[2], eye_points[4])
    h_dist = euclidean_dist(eye_points[0], eye_points[3])

    if h_dist <= 0:
        return 0.0

    return (v1 + v2) / (2.0 * h_dist)


class VisionEngine:
    """Motor biométrico con cálculo de EAR, tasa de parpadeo reactiva y heurística dinámica."""

    def __init__(self, camera_index: int = 0, show_preview: bool = False):
        self.camera_index = camera_index
        self.show_preview = show_preview
        self.cap = None
        self.is_running = False
        self.is_paused = False
        self.thread = None

        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # Historial de parpadeos en ventana temporal reducida
        self.blink_timestamps = deque()
        self.is_eye_closed = False
        self.current_ear = 0.28
        self.smooth_ear = 0.28
        self.blink_rate = 16
        self.fatigue_level = 18.0
        self.last_update_time = time.time()

    def _extract_eye_points(self, landmarks, indices, w: int, h: int) -> list:
        return [(landmarks.landmark[idx].x * w, landmarks.landmark[idx].y * h) for idx in indices]

    def _update_metrics(self, ear: float):
        """
        Actualiza métricas en tiempo real con:
        1. Prioridad de Recuperación (Override Instantáneo): Si smooth_ear > 0.18, descanso inmediato.
        2. Ventana de memoria reducida a 15 segundos para olvidar tics/sprints de parpadeo rápidamente.
        3. Límites dinámicos estrictos [0.0, 100.0].
        """
        now = time.time()
        dt = min(1.0, max(0.001, now - self.last_update_time))
        self.last_update_time = now

        # Suavizado exponencial del EAR para mitigar ruido y jitter de cámara
        self.smooth_ear = round(0.85 * self.smooth_ear + 0.15 * ear, 3)
        self.current_ear = self.smooth_ear

        # Detección de parpadeo por cruce de umbral
        if ear < EAR_THRESHOLD:
            if not self.is_eye_closed:
                self.is_eye_closed = True
                self.blink_timestamps.append(now)
        else:
            self.is_eye_closed = False

        # Depurar parpadeos mayores a la ventana reducida (15 segundos)
        while self.blink_timestamps and (now - self.blink_timestamps[0] > BPM_WINDOW_SECONDS):
            self.blink_timestamps.popleft()

        # Cálculo de BPM extrapolado a 60 segundos desde la ventana de 15 segundos
        count = len(self.blink_timestamps)
        if count > 0:
            # Extrapolación precisa: (parpadeos en 15s) * (60s / 15s) = count * 4
            extrapolated_bpm = int(round(count * (60.0 / BPM_WINDOW_SECONDS)))
            self.blink_rate = max(10, min(60, extrapolated_bpm))
        else:
            self.blink_rate = 16

        # -------------------------------------------------------------
        # HEURÍSTICA DE FATIGA EN TIEMPO REAL:
        # PRIORIDAD DE RECUPERACIÓN (OVERRIDE INSTANTÁNEO):
        # Si el ojo está abierto (smooth_ear > 0.18), se activa el decay
        # inmediatamente, ignorando cualquier ráfaga o sprint previo de BPM.
        # -------------------------------------------------------------
        if self.smooth_ear > 0.18:
            decay = 1.0 * dt
            self.fatigue_level -= decay
        else:
            # Ojo cerrado o con párpados caídos (EAR <= 0.18)
            strain = 0.0

            # Esfuerzo por párpado caído / cierre sostenido
            ear_deficit = (0.18 - self.smooth_ear) * 5.0
            strain += min(1.5, ear_deficit) * dt

            # Penalización por frecuencia anormal solo cuando el ojo está en fatiga/cerrándose
            if self.blink_rate > 25:
                fast_blink_strain = (self.blink_rate - 25.0) * 0.04
                strain += min(1.5, fast_blink_strain) * dt
            elif self.blink_rate < 14:
                strain += min(1.5, (14.0 - self.blink_rate) * 0.06) * dt

            self.fatigue_level += strain

        # Límites estrictos [0.0, 100.0]
        self.fatigue_level = min(100.0, max(0.0, self.fatigue_level))

    def _process_loop(self):
        """Bucle de inferencia continuo en segundo plano con soporte de pausa física de hardware."""
        logging.info("Motor de visión OptiFlow iniciado activamente.")

        try:
            while self.is_running:
                if self.is_paused:
                    # Si el monitoreo está pausado, liberar explícitamente el hardware de la cámara (apagar LED)
                    if self.cap is not None and self.cap.isOpened():
                        self.cap.release()
                        self.cap = None
                        logging.info("[VisionEngine] Hardware de cámara liberado (LED apagado) por pausa de monitoreo.")
                    time.sleep(0.1)
                    continue

                # Si no está en pausa pero la cámara no está instanciada, reactivarla
                if self.cap is None or not self.cap.isOpened():
                    self.cap = cv2.VideoCapture(self.camera_index)
                    if not self.cap.isOpened():
                        logging.warning(f"No se pudo abrir la cámara {self.camera_index}. Reintentando...")
                        time.sleep(1.0)
                        continue
                    logging.info(f"[VisionEngine] Hardware de cámara {self.camera_index} activado (LED encendido).")

                ret, frame = self.cap.read()
                if not ret:
                    time.sleep(0.05)
                    continue

                h, w, _ = frame.shape
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                rgb_frame.flags.writeable = False
                results = self.face_mesh.process(rgb_frame)

                if results.multi_face_landmarks:
                    face_landmarks = results.multi_face_landmarks[0]
                    left_eye = self._extract_eye_points(face_landmarks, LEFT_EYE_INDICES, w, h)
                    right_eye = self._extract_eye_points(face_landmarks, RIGHT_EYE_INDICES, w, h)

                    left_ear = calculate_ear(left_eye)
                    right_ear = calculate_ear(right_eye)
                    avg_ear = (left_ear + right_ear) / 2.0

                    self._update_metrics(avg_ear)

                if self.show_preview:
                    cv2.imshow("OptiFlow Biometrics", frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
        finally:
            self.release()

    def pause(self):
        """Pausa el monitoreo y apaga el hardware de la cámara liberando el recurso explícitamente."""
        self.is_paused = True
        if self.cap is not None and self.cap.isOpened():
            self.cap.release()
            self.cap = None
        logging.info("[VisionEngine] Comando pause ejecutado: self.cap.release() completado (LED apagado).")

    def resume(self):
        """Reanuda el monitoreo y re-instancia el hardware de la cámara."""
        self.is_paused = False
        if self.cap is None or not self.cap.isOpened():
            self.cap = cv2.VideoCapture(self.camera_index)
        logging.info(f"[VisionEngine] Comando resume ejecutado: cv2.VideoCapture({self.camera_index}) iniciado.")

    def handle_command(self, cmd: dict):
        """Procesa comandos de control de hardware provenientes de WebSocket o IPC."""
        action = cmd.get("action")
        if action == "pause":
            self.pause()
        elif action == "resume":
            self.resume()

    def start_background(self):
        """Inicia el procesamiento de visión en un hilo demonio desacoplado."""
        if not self.is_running:
            self.is_running = True
            self.thread = threading.Thread(target=self._process_loop, daemon=True)
            self.thread.start()

    def get_telemetry_payload(self) -> dict:
        """Devuelve la telemetría actual procesada por la cámara."""
        return {
            "fatigue_level": round(float(self.fatigue_level), 1),
            "blink_rate": int(self.blink_rate),
            "active_app": "VS Code",
            "ear": self.current_ear
        }

    def release(self):
        """Libera la cámara y los recursos de inferencia."""
        self.is_running = False
        if self.cap is not None and self.cap.isOpened():
            self.cap.release()
        if self.face_mesh:
            self.face_mesh.close()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    engine = VisionEngine(show_preview=True)
    engine.start_background()
    try:
        while True:
            time.sleep(2)
            print("Telemetría:", engine.get_telemetry_payload())
    except KeyboardInterrupt:
        engine.release()
