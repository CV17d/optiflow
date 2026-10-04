import cv2
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


class VisionEngine:
    """Motor de captura y procesamiento biométrico visual con OpenCV."""

    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap = None

    def start_capture(self, window_name: str = "OptiFlow - Monitoreo Visual"):
        """Inicializa la cámara web y muestra los frames en tiempo real hasta pulsar 'q'."""
        self.cap = cv2.VideoCapture(self.camera_index)

        if not self.cap.isOpened():
            logging.error(
                f"No se pudo acceder a la cámara web en el índice {self.camera_index}."
            )
            return

        logging.info("Cámara web inicializada. Presiona 'q' en la ventana de video para salir.")

        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    logging.warning("No se pudo recibir el frame de la cámara. Saliendo...")
                    break

                # Mostrar el video en tiempo real
                cv2.imshow(window_name, frame)

                # Salir al presionar la tecla 'q'
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    logging.info("Detención de captura solicitada por el usuario.")
                    break
        finally:
            self.release()

    def release(self):
        """Libera la cámara web y destruye todas las ventanas abiertas de OpenCV."""
        if self.cap is not None and self.cap.isOpened():
            self.cap.release()
            logging.info("Recurso de cámara liberado exitosamente.")
        cv2.destroyAllWindows()


def main():
    engine = VisionEngine()
    engine.start_capture()


if __name__ == "__main__":
    main()
