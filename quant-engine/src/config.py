import os

# Configuración de red
# En Docker, bind a 0.0.0.0 para escuchar conexiones externas (del Ingestor)
ZMQ_ADDRESS = os.getenv("ZMQ_ADDRESS", "tcp://0.0.0.0:5556")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "signals")

ARBITRAGE_THRESHOLD = float(os.getenv("ARBITRAGE_THRESHOLD", 0.0))  # 0.0% (Modo Demo: dejar pasar todo)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
