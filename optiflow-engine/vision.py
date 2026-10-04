import cv2
import logging
import mediapipe as mp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Índices canónicos de MediaPipe Face Mesh para contorno de ojos (EAR)
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]


class VisionEngine:
    """Motor de captura y procesamiento biométrico visual con OpenCV y MediaPipe."""

    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap = None
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def start_capture(self, window_name: str = "OptiFlow - Detección Ocular MediaPipe"):
        """Captura frames, procesa landmarks con Face Mesh y dibuja el contorno ocular."""
        self.cap = cv2.VideoCapture(self.camera_index)

        if not self.cap.isOpened():
            logging.error(f"No se pudo acceder a la cámara en el índice {self.camera_index}.")
            return

        logging.info("Cámara web activa con MediaPipe Face Mesh. Presiona 'q' para salir.")

        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    logging.warning("No se pudo recibir el frame. Saliendo...")
                    break

                h, w, _ = frame.shape

                # Conversión a RGB requerida por MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                rgb_frame.flags.writeable = False
                results = self.face_mesh.process(rgb_frame)

                # Detección y dibujo de puntos de interés ocular
                if results.multi_face_landmarks:
                    for face_landmarks in results.multi_face_landmarks:
                        # Dibujar puntos del ojo izquierdo
                        for idx in LEFT_EYE_INDICES:
                            lm = face_landmarks.landmark[idx]
                            cx, cy = int(lm.x * w), int(lm.y * h)
                            cv2.circle(frame, (cx, cy), 2, (0, 255, 200), -1)

                        # Dibujar puntos del ojo derecho
                        for idx in RIGHT_EYE_INDICES:
                            lm = face_landmarks.landmark[idx]
                            cx, cy = int(lm.x * w), int(lm.y * h)
                            cv2.circle(frame, (cx, cy), 2, (0, 200, 255), -1)

                    # Indicador de estado en pantalla
                    cv2.putText(
                        frame,
                        "OptiFlow Biometrics: Ojos Detectados",
                        (20, 35),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 0),
                        2
                    )

                cv2.imshow(window_name, frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    logging.info("Detención de captura solicitada por el usuario.")
                    break
        finally:
            self.release()

    def release(self):
        """Libera la cámara, el modelo de IA y cierra ventanas."""
        if self.cap is not None and self.cap.isOpened():
            self.cap.release()
            logging.info("Cámara liberada correctamente.")
        if self.face_mesh:
            self.face_mesh.close()
        cv2.destroyAllWindows()


def main():
    engine = VisionEngine()
    engine.start_capture()


if __name__ == "__main__":
    main()
