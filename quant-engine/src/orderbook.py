class OrderBook:
    def __init__(self):
        self.price = None
        self.exchange = None

    def update(self, tick):
        self.price = tick.get("price")
        self.exchange = tick.get("exchange")

    def snapshot(self):
        return {
            "price": self.price,
            "exchange": self.exchange
        }
