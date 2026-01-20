# main.py
import asyncio
import logging
import signal
import sys

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

# Intentar usar uvloop para mejor performance (no disponible en Windows)
try:
    import uvloop
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    logger_setup = logging.getLogger("setup")
    logger_setup.info("✅ uvloop activado (Linux/Docker)")
except ImportError:
    if sys.platform == "win32":
        pass  # Windows no soporta uvloop
    else:
        logging.warning("⚠️ uvloop no disponible, usando event loop estándar")

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("quant-engine")


async def quant_engine_loop(queue, orderbook, strategy, redis_pub):
    while True:
        try:
            tick = await asyncio.wait_for(queue.get(), timeout=5.0)
            
            orderbook.update(tick)
            prices = orderbook.snapshot()
            logger.debug(f"OrderBook snapshot: {prices}")

            signal = strategy.evaluate(prices)
            if signal:
                redis_pub.publish(REDIS_CHANNEL, signal)
                logger.info(f"✅ Signal emitted: {signal}")
        except asyncio.TimeoutError:
            logger.debug("⏱️ Cola vacía, esperando ticks...")
        except Exception as e:
            logger.error(f"❌ Error en engine loop: {e}")
            await asyncio.sleep(1)


async def main():
    logger.info("🚀 Iniciando Quant Engine...")
    
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

    try:
        await asyncio.gather(listener_task, engine_task)
    except KeyboardInterrupt:
        logger.info("🛑 Quant Engine shutdown")
        listener_task.cancel()
        engine_task.cancel()
        zmq_listener.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Quant Engine shutdown")
    except Exception as e:
        logger.error(f"❌ Error fatal: {e}")
