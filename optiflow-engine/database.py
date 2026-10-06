import os
import sqlite3
import logging
from typing import Dict, Any, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "optiflow_local.db")


class DBManager:
    """Gestor de base de datos SQLite local para persistencia privada de telemetría."""

    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        self.init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Retorna una conexión a la base de datos SQLite."""
        return sqlite3.connect(self.db_path)

    def init_db(self) -> None:
        """Crea el archivo optiflow_local.db y la tabla session_logs si no existen."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS session_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        fatigue_level REAL,
                        blink_rate INTEGER,
                        ear REAL,
                        active_app TEXT
                    );
                """)
                conn.commit()
            logging.info(f"Base de datos SQLite inicializada exitosamente en: {self.db_path}")
        except sqlite3.Error as e:
            logging.error(f"Error al inicializar la base de datos SQLite: {e}")
            raise

    def insert_telemetry(
        self,
        fatigue_level: float,
        blink_rate: int,
        ear: float,
        active_app: str
    ) -> bool:
        """Inserta una instantánea de telemetría en la tabla session_logs."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO session_logs (fatigue_level, blink_rate, ear, active_app)
                    VALUES (?, ?, ?, ?);
                """, (float(fatigue_level), int(blink_rate), float(ear), str(active_app)))
                conn.commit()
            return True
        except sqlite3.Error as e:
            logging.error(f"Error al registrar telemetría en SQLite: {e}")
            return False


if __name__ == "__main__":
    db = DBManager()
    success = db.insert_telemetry(18.5, 16, 0.28, "VS Code")
    print(f"Registro de prueba insertado: {success}")
