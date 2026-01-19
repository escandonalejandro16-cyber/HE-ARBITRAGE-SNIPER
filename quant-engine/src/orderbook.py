class OrderBook:
    def __init__(self):
        self.prices = {}

    def update(self, tick):
        self.prices[tick["exchange"]] = tick["price"]

    def snapshot(self):
        return dict(self.prices)
