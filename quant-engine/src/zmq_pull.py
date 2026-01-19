# zmq_pull.py
import zmq
import asyncio

class ZMQPullListener:
    def __init__(self, address: str):
        self.address = address
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.PULL)
        self.socket.bind(address)

    async def listen(self, queue: asyncio.Queue):
        loop = asyncio.get_running_loop()

        while True:
            tick = await loop.run_in_executor(None, self.socket.recv_json)
            await queue.put(tick)

    def close(self):
        self.socket.close()
        self.context.term()
