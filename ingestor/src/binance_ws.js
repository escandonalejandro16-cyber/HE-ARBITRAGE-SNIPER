import WebSocket from "ws";

const BINANCE_WS =
  "wss://stream.binance.com:9443/ws/btcusdt@trade";

export class BinanceWS {
  constructor(onTick) {
    this.onTick = onTick;
    this.ws = null;
  }

  connect() {
    console.log("🟡 Conectando a Binance WS...");
    this.ws = new WebSocket(BINANCE_WS);

    this.ws.on("open", () => {
      console.log("🟢 Binance WS conectado");
    });

    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      // Normalización mínima
      const tick = {
        exchange: "BINANCE",
        price: Number(msg.p),
        ts: msg.T
      };

      this.onTick(tick);
    });

    this.ws.on("close", () => {
      console.log("🔴 Binance WS desconectado, reconectando...");
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on("error", (err) => {
      console.error("❌ Binance WS error:", err.message);
      this.ws.close();
    });
  }
}
