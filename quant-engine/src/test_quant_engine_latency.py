import asyncio
import unittest
from datetime import datetime, timezone
from orderbook import OrderBook
from strategy import StrategyEngine

class DummyRedisPublisher:
    """Mock de RedisPublisher con timestamps y prints"""
    def __init__(self):
        self.published = []

    def publish(self, channel, message):
        published_at = datetime.now(timezone.utc)
        message["_published_at"] = published_at.strftime("%H:%M:%S.%f")
        self.published.append((channel, message))
        print(f"📤 Señal publicada -> {channel}: {message}", flush=True)


class TestQuantEngineLatency(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.orderbook = OrderBook()
        self.strategy = StrategyEngine()
        self.redis_pub = DummyRedisPublisher()
        self.queue = asyncio.Queue()

    async def test_latency_measurement(self):
        """Mide latencia real desde tick hasta señal"""
        ticks = [
            {"exchange": "A", "price": 100.0},
            {"exchange": "B", "price": 101.0}
        ]

        for tick in ticks:
            # Timestamp real y timezone-aware
            tick["_received_at"] = datetime.now(timezone.utc)
            print(f"➡️ Tick recibido: {tick}", flush=True)
            await self.queue.put(tick)

        while not self.queue.empty():
            tick = await self.queue.get()
            self.orderbook.update(tick)
            prices = self.orderbook.snapshot()
            print(f"📊 OrderBook snapshot: {prices}", flush=True)

            signal = self.strategy.evaluate(prices)
            if signal:
                # Latencia real en ms
                published_at = datetime.now(timezone.utc)
                latency = (published_at - tick["_received_at"]).total_seconds() * 1000
                signal["_latency_ms"] = round(latency, 3)
                self.redis_pub.publish("signals", signal)
                print(f"⏱ Latencia: {latency:.3f} ms", flush=True)

        # Validaciones
        self.assertGreaterEqual(len(self.redis_pub.published), 1)
        channel, message = self.redis_pub.published[0]
        self.assertIn("_latency_ms", message)
        self.assertIn("buy", message)
        self.assertIn("sell", message)
        self.assertIn("spread", message)


if __name__ == "__main__":
    unittest.main()
