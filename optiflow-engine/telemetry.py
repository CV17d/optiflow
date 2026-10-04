import logging
import pygetwindow as gw

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


class AppTracker:
    """Rastreador de ventanas activas del sistema operativo."""

    def __init__(self):
        pass

    def get_raw_active_title(self) -> str:
        """Obtiene el título sin procesar de la ventana activa en el SO."""
        try:
            title = gw.getActiveWindowTitle()
            if title and isinstance(title, str):
                return title.strip()
        except Exception as e:
            logging.debug(f"Error consultando ventana activa: {e}")
        return ""

    def get_active_app(self) -> str:
        """Extrae y normaliza el nombre de la aplicación activa a partir del título."""
        raw_title = self.get_raw_active_title()
        if not raw_title:
            return "VS Code"

        lower_title = raw_title.lower()

        if "visual studio code" in lower_title or "code" in lower_title:
            return "VS Code"
        elif "cursor" in lower_title:
            return "Cursor"
        elif "idea" in lower_title or "intellij" in lower_title:
            return "IntelliJ IDEA"
        elif "pycharm" in lower_title:
            return "PyCharm"
        elif "chrome" in lower_title:
            return "Chrome"
        elif "edge" in lower_title:
            return "Edge"
        elif "firefox" in lower_title:
            return "Firefox"
        elif "word" in lower_title:
            return "Word"
        elif "excel" in lower_title:
            return "Excel"
        elif "slack" in lower_title:
            return "Slack"
        elif "terminal" in lower_title or "powershell" in lower_title or "cmd" in lower_title:
            return "Terminal"

        parts = [p.strip() for p in raw_title.split("-") if p.strip()]
        if len(parts) > 1:
            return parts[-1]
        return raw_title[:30]


if __name__ == "__main__":
    tracker = AppTracker()
    print("Aplicación activa detectada:", tracker.get_active_app())
