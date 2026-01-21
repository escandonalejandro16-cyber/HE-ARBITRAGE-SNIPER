import logging
import random

logger = logging.getLogger("strategy")

class StrategyEngine:
    def __init__(self):
        self.evaluation_count = 0
        self.signal_count = 0
    
    def evaluate(self, prices: dict, orderbook_source=None, threshold=0.005):
        """Evaluar strategy y rastrear origen de datos"""
        self.evaluation_count += 1
        
        if len(prices) < 2:
            # --- MODO DEBUG: Simular KRAKEN si falta ---
            if len(prices) == 1 and "BINANCE" in prices:
                binance_price = prices["BINANCE"]
                # Simular precio de Kraken con una pequeña variación aleatoria (+/- 0.1%)
                variation = random.uniform(-0.001, 0.001)
                prices["KRAKEN"] = binance_price * (1 + variation)
                logger.info(f"🧪 [DEBUG] No llega Kraken. Simulando precio: {prices['KRAKEN']:.2f}")
            else:
                exchanges = list(prices.keys()) if prices else []
                logger.warning(f"⚠️ [STRATEGY EVAL #{self.evaluation_count}] Esperando 2 exchanges, tengo {len(prices)}: {exchanges}")
                return None

        exchanges = list(prices.keys())
        a, b = exchanges[0], exchanges[1]

        price_a = prices[a]
        price_b = prices[b]

        spread = (price_b - price_a) / price_a
        
        logger.debug(f"📈 [STRATEGY EVAL #{self.evaluation_count}] Comparando {a}=${price_a} vs {b}=${price_b}, Spread={spread*100:.4f}%")

        if abs(spread) >= threshold:
            self.signal_count += 1
            signal = {
                "buy": a if price_a < price_b else b,
                "sell": b if price_a < price_b else a,
                "spread": round(spread * 100, 4),
                "_signal_number": self.signal_count,
                "_from_orderbook_source": orderbook_source,
                "_evaluation_number": self.evaluation_count
            }
            logger.info(f"🎯 [SIGNAL GENERADA #{self.signal_count}] COMPRAR en {signal['buy']} VENDER en {signal['sell']}, Spread={signal['spread']}%")
            return signal
        
        return None
