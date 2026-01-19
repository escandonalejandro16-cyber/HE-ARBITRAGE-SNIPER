class StrategyEngine:
    def evaluate(self, prices: dict, threshold=0.005):
        if len(prices) < 2:
            return None

        exchanges = list(prices.keys())
        a, b = exchanges[0], exchanges[1]

        price_a = prices[a]
        price_b = prices[b]

        spread = (price_b - price_a) / price_a

        if abs(spread) >= threshold:
            return {
                "buy": a if price_a < price_b else b,
                "sell": b if price_a < price_b else a,
                "spread": round(spread * 100, 4)
            }

        return None
