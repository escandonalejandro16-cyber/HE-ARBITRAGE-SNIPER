import logging

logger = logging.getLogger("orderbook")

class OrderBook:
    def __init__(self):
        self.prices = {}
        self.sources = {}  # Rastrear origen de cada precio

    def update(self, tick):
        """Actualizar precio y guardar información de origen"""
        exchange = tick["exchange"]
        price = tick["price"]
        source = tick.get("_source", "UNKNOWN")
        address = tick.get("_address", "UNKNOWN")
        
        self.prices[exchange] = price
        self.sources[exchange] = {"source": source, "address": address}
        
        logger.info(f"💾 [ORDERBOOK] {exchange} = ${price} (from {source} @ {address})")

    def snapshot(self):
        """Retorna solo los precios"""
        return dict(self.prices)
    
    def get_price_with_source(self, exchange):
        """Obtener precio con información de origen"""
        price = self.prices.get(exchange)
        source_info = self.sources.get(exchange, {})
        return {"price": price, **source_info}
    
    def get_all_with_sources(self):
        """Obtener todos los precios con sus orígenes"""
        return {exchange: {"price": self.prices.get(exchange), **self.sources.get(exchange, {})} 
                for exchange in self.prices}
