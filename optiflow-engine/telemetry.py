import logging
import pygetwindow as gw

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Sistema de reglas de carga cognitiva e impacto ergonómico
APP_CATEGORIES = {
    "Enfoque Profundo": [
        "visual studio code", "code", "cursor", "idea", "intellij",
        "pycharm", "sublime", "vim", "neovim", "terminal", "powershell"
    ],
    "Consumo / Fatiga Alta": [
        "chrome", "youtube", "edge", "firefox", "opera", "brave",
        "netflix", "twitch", "video"
    ],
    "Lectura / Fatiga Media": [
        "word", "docs", "notion", "obsidian", "pdf", "acrobat",
        "excel", "sheets"
    ]
}


class AppTracker:
    """Rastreador de ventanas activas del sistema operativo Windows."""

    def __init__(self):
        pass

    def get_raw_active_title(self) -> str:
        """Obtiene el título de la ventana activa en Windows en tiempo real."""
        try:
            window = gw.getActiveWindow()
            if window and hasattr(window, 'title') and window.title:
                return window.title.strip()
            title = gw.getActiveWindowTitle()
            if title and isinstance(title, str):
                return title.strip()
        except Exception as e:
            logging.debug(f"Error consultando ventana activa en Windows: {e}")
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

    def get_app_context(self) -> dict:
        """
        Clasifica la aplicación activa en niveles de carga cognitiva y estado ergonómico.
        Retorna: {"app_name": str, "status": str}
        """
        raw_title = self.get_raw_active_title()
        app_name = self.get_active_app()
        lower_title = raw_title.lower() if raw_title else app_name.lower()

        status = "Uso General"
        for category, keywords in APP_CATEGORIES.items():
            if any(keyword in lower_title for keyword in keywords):
                status = category
                break

        return {
            "app_name": app_name,
            "status": status
        }


if __name__ == "__main__":
    tracker = AppTracker()
    print("Contexto de aplicación:", tracker.get_app_context())
