import asyncio
import unittest
import zmq
import threading
import time
import sys
import os

# Agregar src al path para importar módulos
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ..src.redis_pub import RedisPublisher
from ..src.orderbook import OrderBook
from ..src.strategy import StrategyEngine

# Mock RedisPublisher para no depender de Redis real
class DummyRedisPublisher(RedisPublisher):
    def __init__(self):
        self.published = []

    def publish(self, channel, message):
        self.published.append((channel, message))

# Función para simular envío de ticks ZMQ PUSH
def zmq_producer(address, ticks, delay=0.01):
    context = zmq.Context.instance()
    socket = context.socket(zmq.PUSH)
    socket.connect(address)
    for tick in ticks:
        socket.send_json(tick)
        time.sleep(delay)
    socket.close()
    context.term()


class TestQuantEngineIntegration(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.queue = asyncio.Queue()
        self.orderbook = OrderBook()
        self.strategy = StrategyEngine()
        self.redis_pub = DummyRedisPublisher()

        # Configuramos ZMQ PULL en un puerto random de localhost
        self.address = "tcp://127.0.0.1:5556"
        self.context = zmq.Context.instance()
        self.socket = self.context.socket(zmq.PULL)
        self.socket.bind(self.address)

    async def asyncTearDown(self):
        self.socket.close()
        self.context.term()

    async def test_integration_zmq_to_strategy(self):
        """Prueba flujo completo: ZMQ → Queue → OrderBook → Strategy → Redis"""
        
        # Ticks simulados con spread > 0.5%
        ticks = [
            {"exchange": "A", "price": 100.0},
            {"exchange": "B", "price": 101.0},
        ]

        # Lanzamos producer en un hilo
        producer_thread = threading.Thread(target=zmq_producer, args=(self.address, ticks))
        producer_thread.start()

        # Listener asíncrono
        async def zmq_listener(loop, socket, queue):
            for _ in range(len(ticks)):
                tick = await loop.run_in_executor(None, socket.recv_json)
                await queue.put(tick)

        # Engine asíncrono
        async def quant_engine(queue):
            signals = []
            while not queue.empty():
                tick = await queue.get()
                self.orderbook.update(tick)
                prices = self.orderbook.snapshot()
                signal = self.strategy.evaluate(prices)
                if signal:
                    self.redis_pub.publish("signals", signal)
                    signals.append(signal)
            return signals

        loop = asyncio.get_running_loop()
        await asyncio.gather(
            zmq_listener(loop, self.socket, self.queue),
            quant_engine(self.queue)
        )

        # Esperamos que el hilo productor termine
        producer_thread.join()

        # Verificamos que al menos una señal fue publicada
        self.assertGreaterEqual(len(self.redis_pub.published), 1)
        channel, message = self.redis_pub.published[0]
        self.assertEqual(channel, "signals")
        self.assertIn("buy", message)
        self.assertIn("sell", message)
        self.assertIn("spread", message)
