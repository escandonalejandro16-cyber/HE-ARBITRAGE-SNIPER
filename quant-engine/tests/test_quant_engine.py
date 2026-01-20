import asyncio
import unittest
from unittest.mock import MagicMock
import sys
import os

# Agregar src al path para importar módulos
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ..src.orderbook import OrderBook
from ..src.strategy import StrategyEngine
from ..src.redis_pub import RedisPublisher

class DummyRedisPublisher:
    """Mock de RedisPublisher para pruebas"""
    def __init__(self):
        self.published = []

    def publish(self, channel, message):
        self.published.append((channel, message))


class TestQuantEngine(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        # Setup de orderbook, strategy y redis mock
        self.orderbook = OrderBook()
        self.strategy = StrategyEngine()
        self.redis_pub = DummyRedisPublisher()

        # Cola simulada de ticks
        self.queue = asyncio.Queue()

    async def test_tick_processing_no_signal(self):
        """Verifica que un tick se procese sin generar señal"""
        tick = {"exchange": "A", "price": 100.0}
        await self.queue.put(tick)

        # Procesamiento simulado
        tick_received = await self.queue.get()
        self.orderbook.update(tick_received)
        prices = self.orderbook.snapshot()
        signal = self.strategy.evaluate(prices)

        self.assertEqual(prices, {"A": 100.0})
        self.assertIsNone(signal)
        self.assertEqual(self.redis_pub.published, [])

    async def test_tick_processing_with_signal(self):
        """Verifica que se genere una señal de arbitraje"""
        # Dos ticks de exchanges distintos con diferencia > 0.5%
        ticks = [
            {"exchange": "A", "price": 100.0},
            {"exchange": "B", "price": 101.0}
        ]

        for tick in ticks:
            await self.queue.put(tick)

        while not self.queue.empty():
            tick_received = await self.queue.get()
            self.orderbook.update(tick_received)
            prices = self.orderbook.snapshot()
            signal = self.strategy.evaluate(prices)
            if signal:
                self.redis_pub.publish("signals", signal)

        # Verifica que se haya publicado exactamente una señal
        self.assertEqual(len(self.redis_pub.published), 1)

        channel, message = self.redis_pub.published[0]
        self.assertEqual(channel, "signals")
        self.assertIn("buy", message)
        self.assertIn("sell", message)
        self.assertIn("spread", message)
        self.assertGreaterEqual(abs(message["spread"]), 1.0)  # spread real > 1%

if __name__ == "__main__":
    unittest.main()
