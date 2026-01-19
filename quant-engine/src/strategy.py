class StrategyEngine:
    def evaluate(self, state):
        price = state["price"]
        if price and price > 100:
            return {
                "signal": "SELL",
                "price": price
            }
        return None
