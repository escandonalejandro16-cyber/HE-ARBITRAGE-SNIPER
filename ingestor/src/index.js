import { ZMQPush } from "./zmq_push.js";
import { BinanceWS } from "./binance_ws.js";
import { KrakenWS } from "./kraken_ws.js";

async function main() {
  const zmq = new ZMQPush("tcp://127.0.0.1:5555");
  await zmq.connect();

  console.log("🚀 Iniciando Ingestor Dual-Exchange...\n");

  // Callback unificado para ambos exchanges
  const onTick = (tick) => {
    zmq.send(tick);
  };

  // Conectar Binance
  const binance = new BinanceWS(onTick);
  binance.connect();

  // Conectar Kraken
  const kraken = new KrakenWS(onTick);
  kraken.connect();

  console.log("📊 Escuchando desde Binance + Kraken...\n");
}

main();
