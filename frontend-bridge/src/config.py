import os

# En Docker: REDIS_HOST=redis
# En local: fallback automático a 127.0.0.1
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")

REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "arbitrage.signals")
