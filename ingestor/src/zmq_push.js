import zmq from "zeromq";

export class ZMQPush {
  constructor(address) {
    this.address = address;
    this.socket = new zmq.Push();
    this.queue = [];
    this.sending = false;
  }

  async connect() {
    await this.socket.connect(this.address);
    console.log("🟢 ZMQ PUSH conectado:", this.address);
    this.startSender();
  }

  send(tick) {
    this.queue.push(tick);
  }

  async startSender() {
    if (this.sending) return;
    this.sending = true;

    while (true) {
      if (this.queue.length === 0) {
        await new Promise(r => setTimeout(r, 1));
        continue;
      }

      const tick = this.queue.shift();
      try {
        await this.socket.send(JSON.stringify(tick));
      } catch (err) {
        console.error("ZMQ send error:", err.message);
      }
    }
  }
}
