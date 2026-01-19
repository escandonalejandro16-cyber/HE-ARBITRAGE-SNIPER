# main.py
import asyncio
import logging

from config import (
    ZMQ_ADDRESS,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_CHANNEL,
)
from zmq_pull import ZMQPullListener
from orderbook import OrderBook
from strategy import StrategyEngine
from redis_pub import RedisPublisher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("quant-engine")


async def quant_engine_loop(queue, orderbook, strategy, redis_pub):
    while True:
        tick = await queue.get()

        orderbook.update(tick)
        prices = orderbook.snapshot()

        signal = strategy.evaluate(prices)
        if signal:
            redis_pub.publish(REDIS_CHANNEL, signal)
            logger.info(f"Signal emitted: {signal}")


async def main():
    queue = asyncio.Queue(maxsize=10_000)

    orderbook = OrderBook()
    strategy = StrategyEngine()
    redis_pub = RedisPublisher(REDIS_HOST, REDIS_PORT)

    zmq_listener = ZMQPullListener(ZMQ_ADDRESS)

    listener_task = asyncio.create_task(
        zmq_listener.listen(queue)
    )

    engine_task = asyncio.create_task(
        quant_engine_loop(queue, orderbook, strategy, redis_pub)
    )

    await asyncio.gather(listener_task, engine_task)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Quant Engine shutdown")
