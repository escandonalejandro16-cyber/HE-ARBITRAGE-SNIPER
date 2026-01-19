import redis
import json

class RedisPublisher:
    def __init__(self):
        self.client = redis.Redis(host="localhost", port=6379, decode_responses=True)

    def publish(self, channel, message):
        self.client.publish(channel, json.dumps(message))
