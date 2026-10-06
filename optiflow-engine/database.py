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

    def get_session_stats(self) -> Dict[str, Any]:
        """
        Ejecuta consultas de agregación SQL para obtener:
        - Promedio de fatiga del día de hoy (AVG(fatigue_level)).
        - Aplicación más utilizada en la jornada de hoy.
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()

                # 1. Promedio de fatiga del día de hoy
                cursor.execute("""
                    SELECT AVG(fatigue_level), COUNT(*)
                    FROM session_logs
                    WHERE date(timestamp, 'localtime') = date('now', 'localtime');
                """)
                row_today = cursor.fetchone()
                avg_fatigue = row_today[0] if row_today and row_today[0] is not None else None
                records_today = row_today[1] if row_today else 0

                # Fallback al historial general si hoy aún no hay suficientes registros
                if avg_fatigue is None:
                    cursor.execute("SELECT AVG(fatigue_level), COUNT(*) FROM session_logs;")
                    row_all = cursor.fetchone()
                    avg_fatigue = row_all[0] if row_all and row_all[0] is not None else 18.0
                    total_records = row_all[1] if row_all else 0
                else:
                    total_records = records_today

                # 2. Aplicación más usada del día de hoy
                cursor.execute("""
                    SELECT active_app, COUNT(*) as usage_count
                    FROM session_logs
                    WHERE date(timestamp, 'localtime') = date('now', 'localtime')
                    GROUP BY active_app
                    ORDER BY usage_count DESC
                    LIMIT 1;
                """)
                row_app = cursor.fetchone()
                if not row_app:
                    cursor.execute("""
                        SELECT active_app, COUNT(*) as usage_count
                        FROM session_logs
                        GROUP BY active_app
                        ORDER BY usage_count DESC
                        LIMIT 1;
                    """)
                    row_app = cursor.fetchone()

                most_used_app = row_app[0] if row_app and row_app[0] else "VS Code"

                stats = {
                    "avg_fatigue": round(float(avg_fatigue), 2),
                    "most_used_app": str(most_used_app),
                    "total_records": int(total_records)
                }
                logging.info(f"Estadísticas de sesión calculadas: {stats}")
                return stats
        except sqlite3.Error as e:
            logging.error(f"Error consultando estadísticas de sesión en SQLite: {e}")
            return {
                "avg_fatigue": 18.0,
                "most_used_app": "VS Code",
                "total_records": 0
            }


if __name__ == "__main__":
    db = DBManager()
    success = db.insert_telemetry(18.5, 16, 0.28, "VS Code")
    print(f"Registro de prueba insertado: {success}")
    stats = db.get_session_stats()
    print(f"Estadísticas obtenidas: {stats}")

