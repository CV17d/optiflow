import asyncio
import json
import logging
import websockets
from vision import VisionEngine
from telemetry import AppTracker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

CONNECTED_CLIENTS = set()
vision_engine = VisionEngine(camera_index=0, show_preview=False)
app_tracker = AppTracker()


def get_fused_payload() -> dict:
    """Combina la telemetría biométrica de la cámara con la del sistema operativo."""
    bio_data = vision_engine.get_telemetry_payload()
    app_data = app_tracker.get_app_context()

    return {
        "fatigue_level": bio_data.get("fatigue_level", 18),
        "blink_rate": bio_data.get("blink_rate", 16),
        "ear": bio_data.get("ear", 0.25),
        "active_app": app_data.get("app_name", "VS Code"),
        "app_status": app_data.get("status", "Enfoque Profundo")
    }


async def handler(websocket):
    """Maneja la conexión de un cliente WebSocket."""
    CONNECTED_CLIENTS.add(websocket)
    logging.info(f"Cliente conectado: {websocket.remote_address}")
    try:
        current_data = get_fused_payload()
        await websocket.send(json.dumps(current_data))
        async for _ in websocket:
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        logging.info(f"Cliente desconectado: {websocket.remote_address}")


async def broadcast_telemetry():
    """Bucle infinito que emite métricas biométricas y del SO fusionadas en tiempo real."""
    while True:
        payload = get_fused_payload()
        print(f"Emitiendo: {payload}", flush=True)
        if CONNECTED_CLIENTS:
            message = json.dumps(payload)
            await asyncio.gather(
                *[client.send(message) for client in CONNECTED_CLIENTS.copy()],
                return_exceptions=True
            )
            logging.info(f"Emitiendo telemetría multisensorial ({len(CONNECTED_CLIENTS)} clientes): {payload}")
        await asyncio.sleep(2)


async def main():
    host = "0.0.0.0"
    port = 8765

    # Iniciar motor de visión biométrico en segundo plano
    vision_engine.start_background()

    async with websockets.serve(handler, host, port):
        logging.info(f"Servidor WebSocket OptiFlow escuchando en ws://localhost:{port} (0.0.0.0)")
        await broadcast_telemetry()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        vision_engine.release()
        logging.info("Servidor y motor de visión detenidos correctamente.")
