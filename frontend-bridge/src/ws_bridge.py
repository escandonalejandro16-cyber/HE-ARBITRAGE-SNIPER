import asyncio
import redis.asyncio as redis
import websockets
import json
from config import REDIS_HOST, REDIS_PORT, REDIS_CHANNEL

connected_clients = set()

async def redis_to_ws():
    # Usamos 127.0.0.1 en lugar de localhost para evitar problemas de IPv6 en Windows
    r = redis.Redis(host='127.0.0.1', port=REDIS_PORT, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe(REDIS_CHANNEL)
    
    print(f"📡 ESCUCHANDO REDIS -> Canal: '{REDIS_CHANNEL}'")

    async for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"📥 DATO RECIBIDO DE REDIS: {message['data']}")
            
            if not connected_clients:
                print("⚠️ No hay navegadores abiertos. El dato se descarta.")
                continue

            # Enviar a los clientes
            data = message['data']
            print(f"📤 REENVIANDO A {len(connected_clients)} CLIENTES...")
            await asyncio.gather(*[client.send(data) for client in connected_clients])

async def handler(websocket):
    print("💻 Nuevo navegador conectado")
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)
        print("❌ Navegador cerrado")

async def main():
    async with websockets.serve(handler, "127.0.0.1", 8765):
        print("✅ Servidor WebSocket iniciado en ws://127.0.0.1:8765")
        await redis_to_ws()

if __name__ == "__main__":
    asyncio.run(main())