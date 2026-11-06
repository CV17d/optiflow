import base64
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
        self.last_image_b64 = ""

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
        self.posture_status = "Óptima"
        self.posture_angle = 12.0
        self.smooth_posture_angle = 12.0
        self.left_ear = 0.27
        self.right_ear = 0.27
        self.ear_symmetry = 98.2
        self.last_update_time = time.time()

    def _extract_eye_points(self, landmarks, indices, w: int, h: int) -> list:
        return [(landmarks.landmark[idx].x * w, landmarks.landmark[idx].y * h) for idx in indices]

    def _update_distance_and_posture(self, face_landmarks, w: int, h: int):
        """
        Calcula la distancia focal en cm y la postura cervical en 3D
        a partir de los landmarks faciales de MediaPipe.
        """
        # 1. Distancia a la pantalla usando extremos izquierdo (234) y derecho (454) del rostro
        p234 = (face_landmarks.landmark[234].x * w, face_landmarks.landmark[234].y * h)
        p454 = (face_landmarks.landmark[454].x * w, face_landmarks.landmark[454].y * h)
        face_width_pixels = euclidean_dist(p234, p454)

        if face_width_pixels > 20.0:
            # Constante focal empírica: ~208 px a 640x480 corresponde a ~60 cm
            focal_constant = 12500.0
            raw_dist = focal_constant / face_width_pixels
            clamped_dist = max(25.0, min(110.0, raw_dist))
            self.smooth_distance = round(0.85 * self.smooth_distance + 0.15 * clamped_dist, 1)
            self.current_distance = self.smooth_distance

        # 2. Postura Cervical (Head Pose / Inclinación) usando eje Z de MediaPipe
        # Puntos clave:
        # 1: Punta de la nariz
        # 152: Mentón
        # 10: Frente
        # 234: Sien izquierda
        # 454: Sien derecha
        lm1 = face_landmarks.landmark[1]
        lm152 = face_landmarks.landmark[152]
        lm10 = face_landmarks.landmark[10]
        lm234 = face_landmarks.landmark[234]
        lm454 = face_landmarks.landmark[454]

        face_h = max(0.01, abs(lm152.y - lm10.y))
        face_w = max(0.01, abs(lm454.x - lm234.x))

        # Inclinación sagital (Pitch): profundidad relativa frente vs mentón
        # En flexión cervical hacia abajo, la frente se acerca a la cámara (Z menor) y el mentón se aleja (Z mayor).
        pitch_diff = (lm10.z - lm152.z) / face_h

        # Inclinación transversal (Yaw): giro lateral comparando profundidad de sienes
        yaw_diff = abs(lm234.z - lm454.z) / face_w

        # Inclinación frontal (Roll): desnivel vertical entre sienes
        roll_diff = abs(lm234.y - lm454.y) / face_w

        # Estimación de ángulo equivalente en grados
        angle = round(max(abs(pitch_diff), yaw_diff, roll_diff) * 55.0, 1)
        self.smooth_posture_angle = round(0.8 * self.smooth_posture_angle + 0.2 * angle, 1)
        self.posture_angle = self.smooth_posture_angle

        # Clasificación del estado ergonómico cervical
        if pitch_diff < -0.25 or yaw_diff > 0.30 or roll_diff > 0.26 or self.posture_angle >= 22.0:
            self.posture_status = 'Mala Postura'
        elif pitch_diff < -0.15 or yaw_diff > 0.18 or roll_diff > 0.16 or self.posture_angle >= 13.0:
            self.posture_status = 'Leve Inclinación'
        else:
            self.posture_status = 'Óptima'

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

                    self.left_ear = round(left_ear, 3)
                    self.right_ear = round(right_ear, 3)
                    max_e = max(0.001, max(left_ear, right_ear))
                    self.ear_symmetry = round((min(left_ear, right_ear) / max_e) * 100.0, 1)

                    self._update_metrics(avg_ear)
                    self._update_distance_and_posture(face_landmarks, w, h)

                    # Extraer coordenadas 2D normalizadas de la malla facial (0.0 a 1.0)
                    self.last_face_mesh = [
                        [round(float(lm.x), 4), round(float(lm.y), 4)]
                        for lm in face_landmarks.landmark
                    ]

                # Codificación de feed de video espejado en Base64 para el HUD ovalado de calibración
                if self.calibration_mode:
                    mirrored_frame = cv2.flip(frame, 1)
                    resized_frame = cv2.resize(mirrored_frame, (640, 480))
                    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 65]
                    ret_enc, buffer = cv2.imencode('.jpg', resized_frame, encode_param)
                    if ret_enc:
                        self.last_image_b64 = base64.b64encode(buffer).decode('utf-8')

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
            "image_b64": self.last_image_b64,
            "result": self.calibration_result
        }

    def start_background(self):
        """Inicia el procesamiento de visión en un hilo demonio desacoplado."""
        if not self.is_running:
            self.is_running = True
            self.thread = threading.Thread(target=self._process_loop, daemon=True)
            self.thread.start()

    def get_telemetry_payload(self) -> dict:
        """Devuelve la telemetría actual procesada por la cámara incluyendo distancia estimada, EAR promedio, postura y umbral."""
        return {
            "fatigue_level": round(float(self.fatigue_level), 1),
            "blink_rate": int(self.blink_rate),
            "active_app": "VS Code",
            "ear": self.current_ear,
            "average_ear": round(float(self.smooth_ear), 3),
            "left_ear": round(float(self.left_ear), 3),
            "right_ear": round(float(self.right_ear), 3),
            "ear_symmetry": round(float(self.ear_symmetry), 1),
            "distance": self.smooth_distance,
            "distance_cm": self.smooth_distance,
            "posture_status": self.posture_status,
            "posture_angle": self.posture_angle,
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
