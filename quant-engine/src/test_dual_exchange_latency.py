import asyncio
import unittest
import time
from datetime import datetime, timezone
from orderbook import OrderBook
from strategy import StrategyEngine

class DummyRedisPublisher:
    """Mock de RedisPublisher con timestamps"""
    def __init__(self):
        self.published = []
        self.latencies = []

    def publish(self, channel, message):
        published_at = time.time_ns()  # Nanosegundos para precisión
        message["_published_at"] = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")
        self.published.append((channel, message))
        
        if "_latency_ns" in message:
            self.latencies.append(message["_latency_ns"])
        
        print(f"📤 Señal publicada -> {channel}: spread={message.get('spread', 'N/A')}% latencia={message.get('_latency_us', 'N/A')}µs", flush=True)

    def print_stats(self):
        if self.latencies:
            # Convertir de nanosegundos a microsegundos
            latencies_us = [ns / 1000 for ns in self.latencies]
            avg_latency = sum(latencies_us) / len(latencies_us)
            max_latency = max(latencies_us)
            min_latency = min(latencies_us)
            print(f"\n📊 Estadísticas de Latencia (Interna):")
            print(f"   Min: {min_latency:.1f}µs")
            print(f"   Promedio: {avg_latency:.1f}µs")
            print(f"   Max: {max_latency:.1f}µs")
            print(f"   Señales emitidas: {len(latencies_us)}")
            print(f"   ✅ Objetivo <5ms (5000µs): CUMPLIDO\n")


class TestDualExchangeLatency(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.orderbook = OrderBook()
        self.strategy = StrategyEngine()
        self.redis_pub = DummyRedisPublisher()
        self.queue = asyncio.Queue()

    async def test_dual_exchange_latency(self):
        """Prueba latencia interna con ticks de dos exchanges (Binance + Kraken)"""
        
        print("\n🚀 Test: Latencia Dual-Exchange (Binance + Kraken) - INTERNA\n")
        
        # Simular ticks con spread >= 0.5% (threshold)
        # BINANCE: 42000, KRAKEN: 42210 → spread = 0.5%
        ticks_sequence = [
            {"exchange": "BINANCE", "price": 42000.00, "ts": 1234567890},
            {"exchange": "KRAKEN", "price": 42210.00, "ts": 1234567891},  # 0.5% más caro
            {"exchange": "BINANCE", "price": 42005.00, "ts": 1234567892},
            {"exchange": "KRAKEN", "price": 42220.00, "ts": 1234567893},  # Mantiene spread
        ]

        for tick in ticks_sequence:
            # Timestamp de recepción en NANOSEGUNDOS para máxima precisión
            tick["_received_ns"] = time.time_ns()
            print(f"➡️ Tick recibido: {tick['exchange']} @ ${tick['price']:.2f}", flush=True)
            await self.queue.put(tick)

        # Procesar todos los ticks
        while not self.queue.empty():
            tick = await self.queue.get()
            
            # Procesar OrderBook + Strategy
            self.orderbook.update(tick)
            prices = self.orderbook.snapshot()

            signal = self.strategy.evaluate(prices)
            if signal:
                # Medir latencia en NANOSEGUNDOS desde recepción
                published_ns = time.time_ns()
                latency_ns = published_ns - tick["_received_ns"]
                latency_us = latency_ns / 1000  # microsegundos
                
                signal["_latency_ns"] = latency_ns
                signal["_latency_us"] = round(latency_us, 1)
                self.redis_pub.publish("signals", signal)
            else:
                print(f"   ℹ️ No hay spread suficiente aún", flush=True)

        # Validaciones
        self.assertGreaterEqual(len(self.redis_pub.published), 1, 
                               "Se esperaba al menos 1 signal generada")
        
        # Verificar latencia interna (conversión a microsegundos)
        for latency_ns in self.redis_pub.latencies:
            latency_us = latency_ns / 1000
            self.assertLess(latency_us, 5000.0, f"Latencia {latency_us:.1f}µs excede 5000µs (5ms)")
        
        self.redis_pub.print_stats()


if __name__ == "__main__":
    unittest.main(verbosity=2)
