import sqlite3
import logging
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# En entorno congelado de PyInstaller, la DB se genera junto a server.exe en lugar del directorio temporal _MEIPASS
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).resolve().parent
else:
    BASE_DIR = Path(__file__).resolve().parent

DEFAULT_DB_PATH = BASE_DIR / "optiflow_local.db"


class DBManager:
    """Gestor de base de datos SQLite para persistencia local en OptiFlow (Local-First)."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path) if db_path else str(DEFAULT_DB_PATH)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        """Retorna una conexión a SQLite configurada con row_factory."""
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        """Crea la tabla session_logs si no existe."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS session_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        fatigue_level REAL,
                        blink_rate INTEGER,
                        ear REAL,
                        active_app TEXT
                    )
                """)
                conn.commit()
                logging.info(f"Base de datos SQLite inicializada exitosamente en {self.db_path}")
        except Exception as e:
            logging.error(f"Error al inicializar la base de datos SQLite: {e}")
            raise e

    def insert_log(self, fatigue_level: float, blink_rate: int, ear: float, active_app: str) -> None:
        """Inserta un nuevo registro de telemetría en session_logs."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO session_logs (fatigue_level, blink_rate, ear, active_app)
                    VALUES (?, ?, ?, ?)
                """, (fatigue_level, blink_rate, ear, active_app))
                conn.commit()
        except Exception as e:
            logging.error(f"Error insertando registro en session_logs: {e}")

    def insert_payload(self, payload: dict) -> None:
        """Inserta telemetría directamente desde el diccionario de métricas fusionadas."""
        fatigue = float(payload.get("fatigue_level", 0.0))
        blink = int(payload.get("blink_rate", 0))
        ear = float(payload.get("ear", 0.0))
        app = str(payload.get("active_app", "Desconocido"))
        self.insert_log(fatigue, blink, ear, app)

    def get_average_fatigue(self, limit: Optional[int] = None) -> float:
        """Calcula el promedio del nivel de fatiga acumulado."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                if limit:
                    cursor.execute("""
                        SELECT AVG(fatigue_level) AS avg_fatigue FROM (
                            SELECT fatigue_level FROM session_logs ORDER BY id DESC LIMIT ?
                        )
                    """, (limit,))
                else:
                    cursor.execute("SELECT AVG(fatigue_level) AS avg_fatigue FROM session_logs")
                row = cursor.fetchone()
                if row and row["avg_fatigue"] is not None:
                    return round(float(row["avg_fatigue"]), 2)
                return 0.0
        except Exception as e:
            logging.error(f"Error calculando fatiga promedio: {e}")
            return 0.0

    def get_app_usage_stats(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna estadísticas agregadas de uso de aplicaciones con porcentaje."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT active_app, COUNT(*) as count
                    FROM session_logs
                    GROUP BY active_app
                    ORDER BY count DESC
                    LIMIT ?
                """, (limit,))
                rows = cursor.fetchall()
                total = sum(row["count"] for row in rows) if rows else 0
                stats = []
                for row in rows:
                    percentage = round((row["count"] / total) * 100, 2) if total > 0 else 0.0
                    stats.append({
                        "app": row["active_app"],
                        "count": row["count"],
                        "percentage": percentage
                    })
                return stats
        except Exception as e:
            logging.error(f"Error consultando estadísticas de aplicaciones: {e}")
            return []

    def get_historical_ear(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna registros históricos de Eye Aspect Ratio (EAR) para gráficos temporales."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, timestamp, ear, fatigue_level, blink_rate
                    FROM session_logs
                    ORDER BY id DESC
                    LIMIT ?
                """, (limit,))
                rows = cursor.fetchall()
                history = [
                    {
                        "id": row["id"],
                        "timestamp": row["timestamp"],
                        "ear": round(float(row["ear"]), 4) if row["ear"] is not None else 0.0,
                        "fatigue_level": row["fatigue_level"],
                        "blink_rate": row["blink_rate"]
                    }
                    for row in reversed(rows)
                ]
                return history
        except Exception as e:
            logging.error(f"Error consultando histórico de EAR: {e}")
            return []


if __name__ == "__main__":
    db = DBManager()
    print("Promedio fatiga:", db.get_average_fatigue())
    print("Uso apps:", db.get_app_usage_stats())
    print("Historial EAR:", db.get_historical_ear())
