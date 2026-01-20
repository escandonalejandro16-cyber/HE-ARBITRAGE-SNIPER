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
    """Loop principal: ZMQ → Queue → OrderBook → Strategy → Redis → WebSocket"""
    while True:
        try:
            tick = await asyncio.wait_for(queue.get(), timeout=5.0)
            
            # 1. Datos llegan de la queue (vinieron de ZMQ)
            source = tick.get("_source", "UNKNOWN")
            address = tick.get("_address", "UNKNOWN")
            logger.info(f"1️⃣ [QUEUE] Tick sacado - Origen: {source} ({address})")
            
            # 2. Se actualizan en OrderBook
            orderbook.update(tick)
            logger.info(f"2️⃣ [ORDERBOOK] Datos almacenados")
            
            # 3. Se obtiene snapshot de OrderBook
            prices = orderbook.snapshot()
            logger.info(f"📊 [SNAPSHOT] Precios: {list(prices.keys())} exchanges")
            logger.debug(f"   Detalle: {orderbook.get_all_with_sources()}")

            # 4. Se evalúa la estrategia
            signal = strategy.evaluate(prices)
            
            # 5. Si hay señal, se publica a Redis → WebSocket → Frontend
            if signal:
                logger.info(f"✅ [SIGNAL] Señal detectada: buy={signal['buy']}, sell={signal['sell']}, spread={signal['spread']}%")
                redis_pub.publish(REDIS_CHANNEL, signal)
                logger.info(f"🔴 [REDIS] Publicado → WebSocket → Frontend")
            else:
                logger.debug(f"⏭️ [NO SIGNAL] Spread insuficiente")
                    
        except asyncio.TimeoutError:
            logger.debug("⏱️ Cola vacía, esperando ticks...")
        except Exception as e:
            logger.error(f"❌ Error en engine loop: {e}")
            await asyncio.sleep(1)


async def main():
    logger.info("🚀 Iniciando Quant Engine...")
    logger.info("📡 Flujo: Ingestor (ZMQ) → Quant-Engine → Redis → WebSocket Server → Frontend")
    
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
