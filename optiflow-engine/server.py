import asyncio
import json
import logging
import sys
import threading
import time
import websockets
from vision import VisionEngine
from telemetry import AppTracker
from database import DBManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

CONNECTED_CLIENTS = set()
vision_engine = VisionEngine(camera_index=0, show_preview=False)
app_tracker = AppTracker()
db_manager = DBManager()


def get_fused_payload() -> dict:
    """Combina la telemetría biométrica de la cámara con la del sistema operativo."""
    bio_data = vision_engine.get_telemetry_payload()
    app_data = app_tracker.get_app_context()

    return {
        "fatigue_level": bio_data.get("fatigue_level", 18),
        "blink_rate": bio_data.get("blink_rate", 16),
        "ear": bio_data.get("ear", 0.25),
        "average_ear": bio_data.get("average_ear", 0.26),
        "left_ear": bio_data.get("left_ear", 0.27),
        "right_ear": bio_data.get("right_ear", 0.27),
        "ear_symmetry": bio_data.get("ear_symmetry", 98.2),
        "distance": bio_data.get("distance", 58.4),
        "distance_cm": bio_data.get("distance_cm", 58.4),
        "posture_status": bio_data.get("posture_status", "Óptima"),
        "posture_angle": bio_data.get("posture_angle", 12.0),
        "ear_threshold": bio_data.get("ear_threshold", 0.18),
        "active_app": app_data.get("active_app", "Cursor"),
        "app_status": app_data.get("app_status", "Enfoque Profundo")
    }


async def handler(websocket):
    """Maneja la conexión de un cliente WebSocket."""
    CONNECTED_CLIENTS.add(websocket)
    logging.info(f"Cliente conectado: {websocket.remote_address}")
    try:
        # Enviar estadísticas históricas agregadas desde SQLite antes del streaming en vivo
        avg_fatigue = await asyncio.to_thread(db_manager.get_average_fatigue)
        avg_ear = await asyncio.to_thread(db_manager.get_average_ear)
        app_stats = await asyncio.to_thread(db_manager.get_app_usage_stats)
        ear_history = await asyncio.to_thread(db_manager.get_historical_ear)

        initial_history_payload = {
            "type": "initial_history",
            "historical_stats": {
                "average_fatigue": avg_fatigue,
                "average_ear": avg_ear,
                "app_usage_stats": app_stats,
                "historical_ear": ear_history
            },
            "average_fatigue": avg_fatigue,
            "average_ear": avg_ear,
            "app_usage_stats": app_stats,
            "historical_ear": ear_history
        }
        await websocket.send(json.dumps(initial_history_payload))
        logging.info(f"Estadísticas históricas enviadas al cliente {websocket.remote_address}")

        # Enviar estado biométrico y contextual actual al conectarse
        current_data = get_fused_payload()
        await websocket.send(json.dumps(current_data))

        async for message in websocket:
            try:
                cmd = json.loads(message)
                action = cmd.get("action")
                if action in ("pause", "resume"):
                    vision_engine.handle_command(cmd)
                    status_response = {
                        "type": "camera_status",
                        "action": action,
                        "is_paused": vision_engine.is_paused
                    }
                    await websocket.send(json.dumps(status_response))
                    logging.info(f"Comando WebSocket '{action}' ejecutado para cliente {websocket.remote_address}")
                elif action == "start_calibration":
                    vision_engine.handle_command(cmd)
                    start_response = {
                        "type": "calibration_started",
                        "calibration_active": True
                    }
                    await websocket.send(json.dumps(start_response))
                    logging.info(f"Comando WebSocket 'start_calibration' iniciado para cliente {websocket.remote_address}")
                elif action == "save_calibration":
                    threshold = float(cmd.get("threshold", vision_engine.ear_threshold))
                    vision_engine.handle_command(cmd)
                    save_response = {
                        "type": "calibration_saved",
                        "threshold": vision_engine.ear_threshold,
                        "status": "success"
                    }
                    await websocket.send(json.dumps(save_response))
                    logging.info(f"Comando WebSocket 'save_calibration' guardado: {threshold}")
            except Exception as e:
                logging.error(f"Error procesando mensaje entrante en WebSocket: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        logging.info(f"Cliente desconectado: {websocket.remote_address}")


async def broadcast_telemetry():
    """Bucle infinito que emite métricas biométricas y del SO fusionadas en tiempo real."""
    last_db_save_time = 0.0
    db_save_interval = 10.0  # Guardar en SQLite cada 10 segundos para no saturar el I/O del disco

    while True:
        # Si el modo calibración está activo, emitir el stream a alta frecuencia (~16 FPS)
        if vision_engine.calibration_mode:
            cal_payload = vision_engine.get_calibration_payload()
            if CONNECTED_CLIENTS:
                msg = json.dumps(cal_payload)
                await asyncio.gather(
                    *[client.send(msg) for client in CONNECTED_CLIENTS.copy()],
                    return_exceptions=True
                )
            await asyncio.sleep(0.06)
            continue
        elif vision_engine.calibration_result is not None:
            # Emitir payload final con el resultado de la calibración
            res_payload = {
                "type": "calibration_result",
                **vision_engine.calibration_result
            }
            if CONNECTED_CLIENTS:
                await asyncio.gather(
                    *[client.send(json.dumps(res_payload)) for client in CONNECTED_CLIENTS.copy()],
                    return_exceptions=True
                )
            vision_engine.calibration_result = None
            await asyncio.sleep(0.1)

        payload = get_fused_payload()
        try:
            print(f"Emitiendo: {payload}", flush=True)
        except OSError:
            pass

        now = time.time()
        if now - last_db_save_time >= db_save_interval:
            try:
                await asyncio.to_thread(db_manager.insert_payload, payload)
                last_db_save_time = now
                logging.info(f"Registro de telemetría persistido en SQLite: {payload}")
            except Exception as e:
                logging.error(f"Error al persistir telemetría en SQLite: {e}")

        if CONNECTED_CLIENTS:
            message = json.dumps(payload)
            await asyncio.gather(
                *[client.send(message) for client in CONNECTED_CLIENTS.copy()],
                return_exceptions=True
            )
            logging.info(f"Emitiendo telemetría multisensorial ({len(CONNECTED_CLIENTS)} clientes): {payload}")
        await asyncio.sleep(2)


def listen_stdin_thread():
    """Hilo para recibir comandos JSON enviados a través de stdin desde Electron (IPC nativo)."""
    while True:
        try:
            if sys.stdin is None:
                break
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            cmd = json.loads(line)
            action = cmd.get("action")
            if action in ("pause", "resume", "start_calibration", "save_calibration"):
                vision_engine.handle_command(cmd)
                logging.info(f"[Stdin IPC] Comando '{action}' aplicado al motor biométrico.")
        except OSError:
            # En Windows con entornos desacoplados o sin consola, sys.stdin produce OSError (Errno 22).
            # Manejar silenciosamente sin romper el servidor WebSocket.
            break
        except Exception as e:
            logging.error(f"Error procesando comando desde stdin: {e}")


async def main():
    host = "0.0.0.0"
    port = 8765

    # Iniciar motor de visión biométrico en segundo plano
    vision_engine.start_background()

    # Iniciar escucha de stdin para comandos directos de Electron
    threading.Thread(target=listen_stdin_thread, daemon=True).start()

    async with websockets.serve(handler, host, port):
        logging.info(f"Servidor WebSocket OptiFlow escuchando en ws://localhost:{port} (0.0.0.0)")
        await broadcast_telemetry()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        vision_engine.release()
        logging.info("Servidor y motor de visión detenidos correctamente.")
