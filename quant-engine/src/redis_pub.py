# redis_pub.py
import redis
import json

class RedisPublisher:
    def __init__(self, host="localhost", port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)

    def publish(self, channel: str, message: dict):
        self.client.publish(channel, json.dumps(message))
