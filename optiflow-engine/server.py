import asyncio
import json
import logging
import websockets
from vision import VisionEngine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

CONNECTED_CLIENTS = set()
vision_engine = VisionEngine(camera_index=0, show_preview=False)


async def handler(websocket):
    """Maneja la conexión de un cliente WebSocket."""
    CONNECTED_CLIENTS.add(websocket)
    logging.info(f"Cliente conectado: {websocket.remote_address}")
    try:
        # Enviar inmediatamente el estado actual al conectar
        current_data = vision_engine.get_telemetry_payload()
        await websocket.send(json.dumps(current_data))
        async for _ in websocket:
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        logging.info(f"Cliente desconectado: {websocket.remote_address}")


async def broadcast_telemetry():
    """Bucle infinito que emite métricas biométricas reales calculadas por VisionEngine."""
    while True:
        payload = vision_engine.get_telemetry_payload()
        if CONNECTED_CLIENTS:
            message = json.dumps(payload)
            await asyncio.gather(
                *[client.send(message) for client in CONNECTED_CLIENTS.copy()],
                return_exceptions=True
            )
            logging.info(f"Emitiendo biometría real ({len(CONNECTED_CLIENTS)} clientes): {payload}")
        await asyncio.sleep(2)


async def main():
    host = "localhost"
    port = 8765

    # Iniciar motor de visión biométrico en segundo plano
    vision_engine.start_background()

    async with websockets.serve(handler, host, port):
        logging.info(f"Servidor WebSocket OptiFlow escuchando en ws://{host}:{port}")
        await broadcast_telemetry()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        vision_engine.release()
        logging.info("Servidor y motor de visión detenidos correctamente.")
