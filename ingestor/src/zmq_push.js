import zmq from "zeromq";

export class ZMQPush {
  constructor(address) {
    this.address = address;
    this.socket = new zmq.Push();
    this.queue = [];
    this.sending = false;
  }

  async connect() {
    try {
      await this.socket.connect(this.address);
      console.log("🟢 ZMQ PUSH conectado:", this.address);
      
      // Pequeña pausa para asegurar que el receptor esté listo
      await new Promise(r => setTimeout(r, 500));
      
      this.startSender();
    } catch (err) {
      console.error("❌ Error conectando ZMQ:", err.message);
      process.exit(1);
    }
  }

  send(tick) {
    this.queue.push(tick);
    if (this.queue.length > 2000 && this.queue.length % 1000 === 0) {
      console.warn(`⚠️ ALERTA: Cola ZMQ acumulando retraso (${this.queue.length} ticks pendientes)`);
    }
  }

  async startSender() {
    if (this.sending) return;
    this.sending = true;

    while (true) {
      if (this.queue.length === 0) {
        await new Promise(r => setTimeout(r, 10));
        continue;
      }

      const tick = this.queue.shift();
      try {
        await this.socket.send(JSON.stringify(tick));
        console.log("📤 Tick enviado:", tick.exchange, tick.price);
      } catch (err) {
        console.error("❌ ZMQ send error:", err.message);
        this.queue.unshift(tick); // Reintenta
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }
}
