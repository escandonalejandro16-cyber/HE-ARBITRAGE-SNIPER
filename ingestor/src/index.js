import { ZMQPush } from "./zmq_push.js";
import { BinanceWS } from "./binance_ws.js";
import { KrakenWS } from "./kraken_ws.js";

// Configuración: En Docker usaremos la variable de entorno ZMQ_ADDRESS
const ZMQ_ADDRESS = process.env.ZMQ_ADDRESS || "tcp://127.0.0.1:5556";

// WATCHDOG: Si no recibimos datos en 60 segundos, asumimos desconexión y reiniciamos
const WATCHDOG_TIMEOUT = 60000; 
let lastTickTime = Date.now();

async function main() {
  const zmq = new ZMQPush(ZMQ_ADDRESS);
  await zmq.connect();

  console.log("🚀 Iniciando Ingestor Dual-Exchange...\n");

  // Callback unificado para ambos exchanges
  const onTick = (tick) => {
    lastTickTime = Date.now(); // Actualizar el pulso del watchdog
    zmq.send(tick);
  };

  // Conectar Binance
  const binance = new BinanceWS(onTick);
  binance.connect();

  // Conectar Kraken
  const kraken = new KrakenWS(onTick);
  kraken.connect();

  console.log("📊 Escuchando desde Binance + Kraken...\n");

  // Iniciar verificación periódica
  setInterval(() => {
    const timeSinceLastTick = Date.now() - lastTickTime;
    if (timeSinceLastTick > WATCHDOG_TIMEOUT) {
      console.error(`❌ WATCHDOG: No hay datos desde hace ${timeSinceLastTick/1000}s. Reiniciando contenedor...`);
      process.exit(1); // Docker reiniciará el servicio automáticamente
    }
  }, 5000);
}

main();
