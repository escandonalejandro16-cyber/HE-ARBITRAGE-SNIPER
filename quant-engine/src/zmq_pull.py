# zmq_pull.py
import zmq
import asyncio
import logging

logger = logging.getLogger("zmq_listener")

class ZMQPullListener:
    def __init__(self, address: str):
        self.address = address
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.PULL)
        self.socket.setsockopt(zmq.RCVTIMEO, 1000)  # 1 segundo timeout
        self.socket.bind(address)
        logger.info(f"✓ ZMQ PULL listener binding en {address}")

    async def listen(self, queue: asyncio.Queue):
        loop = asyncio.get_running_loop()
        logger.info("Iniciando escucha ZMQ...")

        while True:
            try:
                tick = await loop.run_in_executor(None, self.socket.recv_json)
                # ✅ Marcar origen del dato
                tick["_source"] = "ZMQ_LISTENER"
                tick["_address"] = self.address
                logger.info(f"📨 [ORIGEN: ZMQ] {tick.get('exchange')} @ ${tick.get('price')} desde {self.address}")
                await queue.put(tick)
            except zmq.Again:
                # Timeout - continúa sin bloquear
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"❌ Error en ZMQ listener: {e}")
                await asyncio.sleep(1)

    def close(self):
        self.socket.close()
        self.context.term()
