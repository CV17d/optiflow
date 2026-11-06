import cv2
import json
import logging
import math
import sys
import threading
import time
from collections import deque
from pathlib import Path
import mediapipe as mp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Resolución de ruta para persistencia de calibración (dev vs PyInstaller)
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).resolve().parent
else:
    BASE_DIR = Path(__file__).resolve().parent

CONFIG_PATH = BASE_DIR / "calibration_config.json"


def load_saved_threshold(default_val: float = 0.18) -> float:
    """Carga el umbral anatómico personalizado si existe en el archivo local de configuración."""
    try:
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                val = float(data.get("ear_threshold", default_val))
                logging.info(f"Umbral anatómico personalizado cargado desde {CONFIG_PATH}: {val}")
                return val
    except Exception as e:
        logging.error(f"Error cargando archivo de configuración de calibración: {e}")
    return default_val


def save_saved_threshold(val: float) -> None:
    """Guarda el umbral anatómico personalizado en el archivo local de configuración."""
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump({"ear_threshold": round(val, 3)}, f, indent=2)
        logging.info(f"Umbral anatómico guardado exitosamente en {CONFIG_PATH}: {val}")
    except Exception as e:
        logging.error(f"Error guardando archivo de configuración de calibración: {e}")


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

        # Umbral anatómico configurable (0.18 por defecto o cargado de disco)
        self.ear_threshold = load_saved_threshold(0.18)

        # Estado de Modo Calibración
        self.calibration_mode = False
        self.calibration_start_time = None
        self.calibration_duration = 15.0
        self.calibration_min_ear = 1.0
        self.calibration_max_ear = 0.0
        self.calibration_result = None
        self.last_face_mesh = []

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
        self.smooth_distance = 58.4
        self.current_distance = 58.4
        self.last_update_time = time.time()

    def _extract_eye_points(self, landmarks, indices, w: int, h: int) -> list:
        return [(landmarks.landmark[idx].x * w, landmarks.landmark[idx].y * h) for idx in indices]

    def _update_distance(self, left_eye: list, right_eye: list):
        """Estima la distancia ergonómica hacia la pantalla en centímetros usando la inversa del ancho de ojos."""
        if len(left_eye) > 0 and len(right_eye) > 0:
            eye_span = euclidean_dist(left_eye[0], right_eye[0])
            if eye_span > 10.0:
                raw_dist = 5840.0 / eye_span
                clamped_dist = max(35.0, min(95.0, raw_dist))
                self.smooth_distance = round(0.85 * self.smooth_distance + 0.15 * clamped_dist, 1)
                self.current_distance = self.smooth_distance

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

        # Detección de parpadeo por cruce de umbral (usando umbral anatómico personalizado)
        if ear < self.ear_threshold:
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
        # Si el ojo está abierto (smooth_ear > self.ear_threshold), se activa el decay
        # inmediatamente, ignorando cualquier ráfaga o sprint previo de BPM.
        # -------------------------------------------------------------
        if self.smooth_ear > self.ear_threshold:
            decay = 1.0 * dt
            self.fatigue_level -= decay
        else:
            # Ojo cerrado o con párpados caídos (EAR <= self.ear_threshold)
            strain = 0.0

            # Esfuerzo por párpado caído / cierre sostenido
            ear_deficit = (self.ear_threshold - self.smooth_ear) * 5.0
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
                    self._update_distance(left_eye, right_eye)

                    # Extraer coordenadas 2D normalizadas de la malla facial (0.0 a 1.0)
                    self.last_face_mesh = [
                        [round(float(lm.x), 4), round(float(lm.y), 4)]
                        for lm in face_landmarks.landmark
                    ]

                # Lógica del ciclo de calibración (15 segundos)
                if self.calibration_mode and self.calibration_start_time:
                    elapsed = time.time() - self.calibration_start_time
                    if elapsed <= self.calibration_duration:
                        # Rastrear EAR mínimo y máximo durante los 15 segundos
                        if self.current_ear > 0.01:
                            self.calibration_min_ear = min(self.calibration_min_ear, self.current_ear)
                            self.calibration_max_ear = max(self.calibration_max_ear, self.current_ear)
                    else:
                        # Finalizar periodo de 15 segundos y calcular umbral anatómico personalizado
                        min_e = self.calibration_min_ear if self.calibration_min_ear < 1.0 else 0.14
                        max_e = self.calibration_max_ear if self.calibration_max_ear > 0.0 else 0.30
                        # personal_threshold = min_ear + ((max_ear - min_ear) * 0.25)
                        personal_threshold = round(min_e + ((max_e - min_e) * 0.25), 3)
                        self.calibration_result = {
                            "threshold": personal_threshold,
                            "min_ear": round(min_e, 3),
                            "max_ear": round(max_e, 3),
                            "completed": True
                        }
                        self.calibration_mode = False
                        logging.info(
                            f"[VisionEngine] Calibración finalizada: Min EAR={min_e:.3f}, Max EAR={max_e:.3f}, Umbral={personal_threshold:.3f}"
                        )

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
        """Procesa comandos de control de hardware y calibración provenientes de WebSocket o IPC."""
        action = cmd.get("action")
        if action == "pause":
            self.pause()
        elif action == "resume":
            self.resume()
        elif action == "start_calibration":
            self.start_calibration()
        elif action == "save_calibration":
            threshold = float(cmd.get("threshold", self.ear_threshold))
            self.save_calibration(threshold)

    def start_calibration(self):
        """Inicia el ciclo interactivo de calibración facial de 15 segundos."""
        self.calibration_mode = True
        self.calibration_start_time = time.time()
        self.calibration_min_ear = 1.0
        self.calibration_max_ear = 0.0
        self.calibration_result = None
        logging.info("[VisionEngine] Modo de calibración biométrica iniciado (15 segundos).")

    def save_calibration(self, threshold: float):
        """Reemplaza el umbral anatómico de EAR y lo persiste en archivo local de configuración."""
        self.ear_threshold = round(float(threshold), 3)
        save_saved_threshold(self.ear_threshold)
        logging.info(f"[VisionEngine] Umbral anatómico actualizado a {self.ear_threshold} y guardado localmente.")

    def get_calibration_payload(self) -> dict:
        """Retorna el payload en tiempo real para renderizar la malla facial en el Canvas del frontend."""
        elapsed = (time.time() - self.calibration_start_time) if self.calibration_start_time else 0.0
        remaining = max(0.0, self.calibration_duration - elapsed)
        progress = min(100.0, round((elapsed / self.calibration_duration) * 100, 1))

        return {
            "type": "calibration_stream",
            "calibration_active": self.calibration_mode,
            "progress": progress,
            "remaining_seconds": round(remaining, 1),
            "current_ear": round(self.current_ear, 3),
            "face_mesh": self.last_face_mesh,
            "result": self.calibration_result
        }

    def start_background(self):
        """Inicia el procesamiento de visión en un hilo demonio desacoplado."""
        if not self.is_running:
            self.is_running = True
            self.thread = threading.Thread(target=self._process_loop, daemon=True)
            self.thread.start()

    def get_telemetry_payload(self) -> dict:
        """Devuelve la telemetría actual procesada por la cámara incluyendo distancia estimada, EAR promedio y umbral."""
        return {
            "fatigue_level": round(float(self.fatigue_level), 1),
            "blink_rate": int(self.blink_rate),
            "active_app": "VS Code",
            "ear": self.current_ear,
            "average_ear": round(float(self.smooth_ear), 3),
            "distance": self.smooth_distance,
            "distance_cm": f"{self.smooth_distance} cm",
            "ear_threshold": self.ear_threshold
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
