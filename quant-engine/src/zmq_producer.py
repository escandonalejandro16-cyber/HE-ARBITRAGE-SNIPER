import zmq
import time
import random

ZMQ_ADDRESS = "tcp://127.0.0.1:5555"

def main():
    context = zmq.Context()
    socket = context.socket(zmq.PUSH)
    socket.connect(ZMQ_ADDRESS)

    print("🚀 ZMQ Producer conectado a", ZMQ_ADDRESS)

    price_a = 100.0
    price_b = 100.2

    try:
        while True:
            # Simulación ligera de mercado
            price_a += random.uniform(-0.05, 0.05)
            price_b += random.uniform(-0.05, 0.05)

            tick_a = {
                "exchange": "A",
                "price": round(price_a, 2)
            }

            tick_b = {
                "exchange": "B",
                "price": round(price_b, 2)
            }

            socket.send_json(tick_a)
            socket.send_json(tick_b)

            print(f"➡️ Sent ticks: {tick_a} | {tick_b}")

            time.sleep(0.05)  # 50 ms (ajustable)

    except KeyboardInterrupt:
        print("🛑 Producer detenido")

    finally:
        socket.close()
        context.term()


if __name__ == "__main__":
    main()
