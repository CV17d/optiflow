import logging
import os
import subprocess
import sys

try:
    import pygetwindow as gw  # type: ignore
except ImportError:
    gw = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# Sistema de reglas de carga cognitiva e impacto ergonómico
APP_CATEGORIES = {
    "Enfoque Profundo": [
        "code", "cursor", "idea", "intellij", "pycharm", "sublime", "vim", "neovim", "terminal", "powershell", "antigravity"
    ],
    "Consumo / Fatiga": [
        "chrome", "edge", "youtube", "firefox", "opera", "brave", "netflix", "twitch"
    ],
    "Lectura / Fatiga Media": [
        "word", "docs", "notion", "obsidian", "pdf", "acrobat", "excel", "sheets"
    ]
}


class AppTracker:
    """Rastreador de ventanas activas y extractor de iconos nativos del sistema operativo Windows."""

    def __init__(self):
        self.icon_cache: dict[str, str] = {}
        self.last_exe_path: str = ""

    def get_foreground_window_info(self) -> tuple[str, str]:
        """
        Obtiene el título de la ventana activa y la ruta absoluta de su ejecutable (.exe).
        Utiliza ctypes con las APIs nativas de Win32 (GetForegroundWindow, GetWindowThreadProcessId,
        OpenProcess y QueryFullProcessImageNameW).
        """
        title = ""
        exe_path = ""

        if sys.platform == "win32":
            try:
                import ctypes
                from ctypes import wintypes

                user32 = ctypes.windll.user32
                kernel32 = ctypes.windll.kernel32

                hwnd = user32.GetForegroundWindow()

                # Fallback con PyGetWindow si GetForegroundWindow devuelve 0
                if not hwnd and gw:
                    try:
                        active_win = gw.getActiveWindow()
                        if active_win and hasattr(active_win, "_hWnd"):
                            hwnd = active_win._hWnd
                    except Exception:
                        pass

                if hwnd:
                    # 1. Obtener título de la ventana
                    length = user32.GetWindowTextLengthW(hwnd)
                    if length > 0:
                        buff = ctypes.create_unicode_buffer(length + 1)
                        user32.GetWindowTextW(hwnd, buff, length + 1)
                        title = buff.value.strip()

                    # 2. Obtener PID y ruta del ejecutable .exe
                    pid = wintypes.DWORD()
                    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    if pid.value > 0:
                        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                        hProcess = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
                        if hProcess:
                            try:
                                p_buf = ctypes.create_unicode_buffer(1024)
                                p_size = wintypes.DWORD(1024)
                                if kernel32.QueryFullProcessImageNameW(hProcess, 0, p_buf, ctypes.byref(p_size)):
                                    exe_path = p_buf.value
                            finally:
                                kernel32.CloseHandle(hProcess)
            except Exception as e:
                logging.debug(f"Error consultando ventana activa con ctypes nativo: {e}")

        # Respaldo secundario para el título con pygetwindow
        if not title and gw:
            try:
                t = gw.getActiveWindowTitle()
                if t and isinstance(t, str):
                    title = t.strip()
            except Exception:
                pass

        return title, exe_path

    def get_raw_active_title(self) -> str:
        """Obtiene el título de la ventana activa en Windows en tiempo real."""
        title, _ = self.get_foreground_window_info()
        return title

    def extract_icon_base64(self, exe_path: str) -> str:
        """
        Extrae el icono nativo real (.ico / .png) asociado al ejecutable .exe de Windows.
        Invoca un script optimizado de PowerShell usando System.Drawing.Icon::ExtractAssociatedIcon
        y devuelve un data URL en Base64 ('data:image/png;base64,...').
        Implementa caché en memoria para 0ms de latencia en llamadas consecutivas.
        """
        if not exe_path or not os.path.exists(exe_path):
            return ""

        # Verificar caché en memoria
        if exe_path in self.icon_cache:
            return self.icon_cache[exe_path]

        ps_script = f"""
Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon("{exe_path}")
if ($icon) {{
    $bitmap = $icon.ToBitmap()
    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    [Convert]::ToBase64String($ms.ToArray())
}}
"""
        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
                capture_output=True,
                text=True,
                timeout=4
            )
            raw_b64 = res.stdout.strip()
            if raw_b64:
                data_url = f"data:image/png;base64,{raw_b64}"
                self.icon_cache[exe_path] = data_url
                logging.info(f"Icono nativo extraído y cacheado para: {exe_path}")
                return data_url
        except Exception as e:
            logging.debug(f"Error extrayendo icono nativo de {exe_path}: {e}")

        return ""

    def find_fallback_exe(self, app_name: str) -> str:
        """
        Busca la ruta del ejecutable para aplicaciones conocidas instaladas en el sistema
        cuando no se puede inferir directamente desde el HWND activo.
        """
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        candidates = [
            os.path.join(local_app_data, r"Programs\Antigravity IDE\Antigravity IDE.exe"),
            os.path.join(local_app_data, r"Programs\antigravity\Antigravity.exe"),
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            os.path.join(local_app_data, r"Programs\Microsoft VS Code\Code.exe"),
            os.path.join(local_app_data, r"Programs\cursor\Cursor.exe"),
            os.path.join(local_app_data, r"cursor\Cursor.exe"),
            r"C:\Program Files\Mozilla Firefox\firefox.exe"
        ]

        lower_app = app_name.lower()
        for c in candidates:
            if os.path.exists(c):
                base_c = os.path.basename(c).lower()
                if lower_app in base_c or any(part in base_c for part in lower_app.split()):
                    return c

        # Si ninguna coincide pero existe alguna instalada (ej. Antigravity IDE), devolverla como fallback
        for c in candidates:
            if os.path.exists(c):
                return c

        return ""

    def get_active_app(self, raw_title: str = "", exe_path: str = "") -> str:
        """Extrae y normaliza el nombre de la aplicación activa a partir del ejecutable o del título."""
        if exe_path:
            base_exe = os.path.basename(exe_path).lower()
            if "antigravity ide.exe" in base_exe:
                return "Antigravity IDE"
            if "antigravity.exe" in base_exe:
                return "Antigravity"
            if "code.exe" in base_exe:
                return "VS Code"
            if "cursor.exe" in base_exe:
                return "Cursor"
            if "idea64.exe" in base_exe or "idea.exe" in base_exe:
                return "IntelliJ IDEA"
            if "pycharm" in base_exe:
                return "PyCharm"
            if "chrome.exe" in base_exe:
                return "Chrome"
            if "msedge.exe" in base_exe:
                return "Edge"
            if "firefox.exe" in base_exe:
                return "Firefox"
            if "discord.exe" in base_exe:
                return "Discord"
            if "slack.exe" in base_exe:
                return "Slack"
            if "spotify.exe" in base_exe:
                return "Spotify"
            if "notion.exe" in base_exe:
                return "Notion"
            if "windowsterminal.exe" in base_exe:
                return "Terminal"
            if "powershell.exe" in base_exe:
                return "PowerShell"
            if "cmd.exe" in base_exe:
                return "CMD"
            if "excel.exe" in base_exe:
                return "Excel"
            if "winword.exe" in base_exe:
                return "Word"

            # Nombre limpio del ejecutable sin extensión
            clean_name = os.path.splitext(os.path.basename(exe_path))[0]
            if clean_name:
                return clean_name

        if not raw_title:
            return "Antigravity IDE"

        lower_title = raw_title.lower()

        if "antigravity" in lower_title:
            return "Antigravity IDE"
        elif "visual studio code" in lower_title or "code" in lower_title:
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
        Clasifica la aplicación activa en niveles de carga cognitiva y extrae su icono nativo real.
        Retorna: {
            "active_app": str,
            "app_status": str,
            "exe_path": str,
            "appIconBase64": str,
            "app_icon_base64": str
        }
        """
        raw_title, exe_path = self.get_foreground_window_info()
        app_name = self.get_active_app(raw_title, exe_path)

        icon_b64 = ""
        if exe_path and os.path.exists(exe_path):
            icon_b64 = self.extract_icon_base64(exe_path)
            self.last_exe_path = exe_path
        else:
            fallback_exe = self.find_fallback_exe(app_name)
            if fallback_exe and os.path.exists(fallback_exe):
                icon_b64 = self.extract_icon_base64(fallback_exe)
                self.last_exe_path = fallback_exe

        lower_title = raw_title.lower() if raw_title else app_name.lower()
        status = "Uso General"
        for category, keywords in APP_CATEGORIES.items():
            if any(keyword in lower_title for keyword in keywords):
                status = category
                break

        return {
            "active_app": app_name,
            "app_status": status,
            "exe_path": exe_path or self.last_exe_path,
            "appIconBase64": icon_b64,
            "app_icon_base64": icon_b64
        }


if __name__ == "__main__":
    tracker = AppTracker()
    ctx = tracker.get_app_context()
    print("Contexto de aplicación:", {k: (v if k != "appIconBase64" and k != "app_icon_base64" else f"{len(v)} chars") for k, v in ctx.items()})
