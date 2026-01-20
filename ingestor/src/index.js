import { ZMQPush } from "./zmq_push.js";
import { BinanceWS } from "./binance_ws.js";

async function main() {
  const zmq = new ZMQPush("tcp://127.0.0.1:5555");
  await zmq.connect();

  const binance = new BinanceWS((tick) => {
    zmq.send(tick); // 🔥 ahora es SAFE
  });

  binance.connect();
}

main();
