import asyncio
import redis.asyncio as redis
import websockets

from config import REDIS_HOST, REDIS_PORT, REDIS_CHANNEL

# Conjunto de clientes WebSocket conectados
connected_clients = set()


async def redis_to_ws():
    """
    Escucha Redis (Pub/Sub) y reenvía los mensajes
    a todos los clientes WebSocket conectados.
    """

    r = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True
    )

    # 🔁 Esperar a que Redis esté disponible (startup seguro en Docker)
    while True:
        try:
            await r.ping()
            print(f"📡 Conectado a Redis en {REDIS_HOST}:{REDIS_PORT}")
            break
        except Exception as e:
            print(f"⏳ Esperando a Redis en {REDIS_HOST}:{REDIS_PORT}... ({e})")
            await asyncio.sleep(2)

    pubsub = r.pubsub()
    await pubsub.subscribe(REDIS_CHANNEL)

    print(f"✅ Suscrito al canal Redis: '{REDIS_CHANNEL}'")

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            data = message["data"]
            print(f"📥 DATO RECIBIDO DE REDIS: {data}")

            if not connected_clients:
                print("⚠️ No hay navegadores conectados. Dato descartado.")
                continue

            print(f"📤 REENVIANDO A {len(connected_clients)} CLIENTES...")
            await asyncio.gather(
                *[client.send(data) for client in connected_clients],
                return_exceptions=True
            )
    except Exception as e:
        print(f"❌ Error en la conexión con Redis: {e}")
    finally:
        await r.aclose()


async def handler(websocket):
    """
    Maneja la conexión de un navegador vía WebSocket
    """
    print(f"💻 Nuevo navegador conectado: {websocket.remote_address}")
    connected_clients.add(websocket)

    try:
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)
        print("❌ Navegador desconectado")


async def main():
    # ⚠️ Dentro de Docker siempre 0.0.0.0
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("🚀 Servidor WebSocket iniciado en ws://0.0.0.0:8765")
        await redis_to_ws()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🛑 Servidor detenido")
