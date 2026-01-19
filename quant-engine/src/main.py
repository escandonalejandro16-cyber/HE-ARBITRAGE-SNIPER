import asyncio

from zmq_pull import create_pull_socket
from orderbook import OrderBook
from strategy import StrategyEngine
from redis_pub import RedisPublisher


async def zmq_listener(loop, socket, queue):
    """
    Escucha ZMQ de forma no bloqueante usando executor
    """
    while True:
        tick = await loop.run_in_executor(None, socket.recv_json)
        await queue.put(tick)


async def quant_engine(queue):
    orderbook = OrderBook()
    strategy = StrategyEngine()
    redis_pub = RedisPublisher()

    print("🟢 Quant Engine ASÍNCRONO operativo (Windows)")

    while True:
        tick = await queue.get()

        orderbook.update(tick)
        prices = orderbook.snapshot()

        signal = strategy.evaluate(prices)
        if signal:
            redis_pub.publish("signals", signal)
            print("📤 ARBITRAJE:", signal)


async def main():
    loop = asyncio.get_running_loop()

    socket = create_pull_socket()
    queue = asyncio.Queue()

    await asyncio.gather(
        zmq_listener(loop, socket, queue),
        quant_engine(queue)
    )


if __name__ == "__main__":
    asyncio.run(main())
