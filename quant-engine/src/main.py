from zmq_pull import create_pull_socket
from orderbook import OrderBook
from strategy import StrategyEngine
from redis_pub import RedisPublisher

def main():
    socket = create_pull_socket()

    orderbook = OrderBook()
    strategy = StrategyEngine()
    redis_pub = RedisPublisher()

    print("🟢 Quant Engine operativo (estable, síncrono)")

    while True:
        tick = socket.recv_json()
        orderbook.update(tick)

        signal = strategy.evaluate(orderbook.snapshot())
        if signal:
            redis_pub.publish("signals", signal)
            print("📤 Señal:", signal)

if __name__ == "__main__":
    main()
