# fastapi_server.py
import asyncio
import json
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from config import REDIS_HOST, REDIS_PORT, REDIS_CHANNEL

app = FastAPI()

# Gestor de conexiones para enviar mensajes a todos los clientes
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    """Inicia la escucha de Redis en segundo plano al arrancar FastAPI"""
    asyncio.create_task(redis_listener())

async def redis_listener():
    """Escucha Redis y hace broadcast a todos los WebSockets"""
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe(REDIS_CHANNEL)
    
    print(f"📡 FastAPI escuchando Redis en canal: {REDIS_CHANNEL}")
    
    async for message in pubsub.listen():
        if message['type'] == 'message':
            # Cuando llega algo de Redis, lo enviamos a todos los navegadores
            await manager.broadcast(message['data'])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Punto de entrada para el Frontend"""
    await manager.connect(websocket)
    try:
        while True:
            # Mantener la conexión viva
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)