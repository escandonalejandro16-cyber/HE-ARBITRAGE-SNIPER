# main.py
import asyncio
from zmq_pull import ZMQPullListener

async def main():
    queue = asyncio.Queue()
    zmq_listener = ZMQPullListener("tcp://127.0.0.1:5555")

    await zmq_listener.listen(queue)

asyncio.run(main())
