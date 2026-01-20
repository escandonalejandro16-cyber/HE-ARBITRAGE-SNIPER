import WebSocket from "ws";

const KRAKEN_WS = "wss://ws.kraken.com";

export class KrakenWS {
  constructor(onTick) {
    this.onTick = onTick;
    this.ws = null;
    this.subscribed = false;
  }

  connect() {
    console.log("🟡 Conectando a Kraken WS...");
    this.ws = new WebSocket(KRAKEN_WS);

    this.ws.on("open", () => {
      console.log("🟢 Kraken WS conectado, suscribiendo a BTC/USDT...");
      this.subscribe();
    });

    this.ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Kraken envía: [channel_id, {bid, bidVolume, ask, askVolume, last, lastVolume, ...}, "ticker", "XBT/USDT"]
        if (Array.isArray(msg) && msg.length >= 2) {
          const tickerData = msg[1];
          
          // Usar el precio del "last trade" o el promedio de bid/ask
          let price = null;
          if (tickerData.last && Array.isArray(tickerData.last)) {
            price = Number(tickerData.last[0]); // último precio
          } else if (tickerData.c && Array.isArray(tickerData.c)) {
            price = Number(tickerData.c[0]); // close price
          } else if (tickerData.bid && tickerData.ask) {
            // Fallback: promedio de bid/ask
            price = (Number(tickerData.bid) + Number(tickerData.ask)) / 2;
          }

          if (price && !isNaN(price)) {
            const tick = {
              exchange: "KRAKEN",
              price: price,
              ts: Date.now()
            };

            console.log(`📨 Kraken tick: ${price}`);
            this.onTick(tick);
          }
        }
      } catch (err) {
        console.error("❌ Error procesando mensaje Kraken:", err.message);
      }
    });

    this.ws.on("close", () => {
      console.log("🔴 Kraken WS desconectado, reconectando en 1s...");
      this.subscribed = false;
      setTimeout(() => this.connect(), 1000);
    });

    this.ws.on("error", (err) => {
      console.error("❌ Kraken WS error:", err.message);
      this.ws.close();
    });
  }

  subscribe() {
    if (this.subscribed) return;

    const subscription = {
      event: "subscribe",
      pair: ["XBT/USDT"],
      subscription: {
        name: "ticker"
      }
    };

    try {
      this.ws.send(JSON.stringify(subscription));
      console.log("✅ Suscripción a Kraken enviada");
      this.subscribed = true;
    } catch (err) {
      console.error("❌ Error en suscripción Kraken:", err.message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
