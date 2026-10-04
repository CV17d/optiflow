import asyncio
import json
import logging
import websockets

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

CONNECTED_CLIENTS = set()


async def handler(websocket):
    """Maneja la conexión de un cliente WebSocket."""
    CONNECTED_CLIENTS.add(websocket)
    logging.info(f"Cliente conectado: {websocket.remote_address}")
    try:
        async for _ in websocket:
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        logging.info(f"Cliente desconectado: {websocket.remote_address}")


async def broadcast_telemetry():
    """Bucle infinito que emite métricas simuladas cada 2 segundos."""
    while True:
        payload = {
            "fatigue_level": 22,
            "blink_rate": 16,
            "active_app": "VS Code"
        }
        if CONNECTED_CLIENTS:
            message = json.dumps(payload)
            await asyncio.gather(
                *[client.send(message) for client in CONNECTED_CLIENTS.copy()],
                return_exceptions=True
            )
            logging.info(f"Emitiendo telemetría a {len(CONNECTED_CLIENTS)} cliente(s): {payload}")
        await asyncio.sleep(2)


async def main():
    host = "localhost"
    port = 8765
    async with websockets.serve(handler, host, port):
        logging.info(f"Servidor WebSocket OptiFlow escuchando en ws://{host}:{port}")
        await broadcast_telemetry()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Servidor OptiFlow detenido.")
