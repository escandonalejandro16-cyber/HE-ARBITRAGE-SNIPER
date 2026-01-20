# 🏗️ ARQUITECTURA TÉCNICA - The Arbitrage Sniper

## Diagrama General

```
                    ┌─────────────────┐
                    │  EXCHANGES      │
                    │  (Reales)       │
                    │                 │
                    │ ├─ Binance      │
                    │ └─ Kraken       │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐    ┌──────────────┐
            │ Binance WS   │    │ Kraken WS    │
            │ btcusdt@     │    │ XBT/USDT     │
            │ trade        │    │ ticker       │
            └──────┬───────┘    └──────┬───────┘
                   │                   │
                   └───────┬───────────┘
                           │
                    ┌──────▼──────┐
                    │  Node.js    │
                    │  Ingestor   │
                    │             │
                    │ ├─ Normalize│
                    │ ├─ ZMQ PUSH │
                    │ └─ Redis    │
                    └──────┬──────┘
                           │
                    ┌──────┴──────────────┐
                    │   ZMQ PULL          │
                    │   tcp://127.0.0.1   │
                    │   :5555             │
                    └──────┬──────────────┘
                           │
                    ┌──────▼───────────┐
                    │ Python Quant     │
                    │ Engine           │
                    │ (asyncio+uvloop) │
                    │                  │
                    │ ├─ ZMQ Listen    │
                    │ ├─ OrderBook     │
                    │ ├─ Strategy      │
                    │ └─ Signal Gen    │
                    └──────┬───────────┘
                           │
                    ┌──────▼──────────┐
                    │  Redis PUB/SUB  │
                    │  Channel:       │
                    │  signals        │
                    └──────┬──────────┘
                           │
                    ┌──────┴──────────┐
                    │                 │
            ┌───────▼────────┐  ┌─────▼──────┐
            │ Logging/       │  │ Frontend   │
            │ Persistence    │  │ Dashboard  │
            └────────────────┘  │ (Node.js)  │
                                │            │
                                │ ├─ Express │
                                │ ├─ Socket  │
                                │ │  .io    │
                                │ └─ Charts  │
                                └────────────┘
                                      │
                                      ▼
                                ┌──────────────┐
                                │ Web Browser  │
                                │              │
                                │ Dashboard    │
                                │ Estadístico  │
                                └──────────────┘
```

---

## Componentes Detallados

### 1️⃣ Node.js Ingestor

**Responsabilidad**: Recolectar datos de exchanges

```javascript
// index.js - Orquestador
├─ BinanceWS
│  ├─ WebSocket: wss://stream.binance.com:9443/ws/btcusdt@trade
│  ├─ Parse: {exchange, price, ts}
│  └─ Callback: zmq.send(tick)
│
└─ KrakenWS
   ├─ WebSocket: wss://ws.kraken.com
   ├─ Suscripción: XBT/USDT ticker
   ├─ Parse: {exchange, price, ts}
   └─ Callback: zmq.send(tick)


// zmq_push.js - Socket ZMQ
├─ Socket tipo: PUSH
├─ Dirección: tcp://127.0.0.1:5555
├─ Cola interna (buffer)
├─ Reconexión automática
└─ Retry logic en fallos
```

**Archivos**:
- `binance_ws.js` (50 líneas)
- `kraken_ws.js` (85 líneas) - **NUEVO**
- `zmq_push.js` (50 líneas)
- `index.js` (25 líneas)

---

### 2️⃣ Python Quant Engine

**Responsabilidad**: Procesar datos y generar signals

```python
# main.py - Orquestador
├─ ZMQPullListener (zmq_pull.py)
│  ├─ Socket tipo: PULL
│  ├─ Dirección: tcp://127.0.0.1:5555
│  ├─ Timeout: 1 segundo
│  └─ Async executor
│
├─ OrderBook (orderbook.py)
│  ├─ Estructura: {exchange: price}
│  ├─ update(tick) - O(1)
│  └─ snapshot() - O(n)
│
├─ StrategyEngine (strategy.py)
│  ├─ evaluate(prices)
│  ├─ Calcula spread = (B-A)/A
│  ├─ Threshold: 0.5%
│  └─ Return: {buy, sell, spread}
│
└─ RedisPublisher (redis_pub.py)
   ├─ Publica signals
   ├─ Channel: "signals"
   ├─ Formato: JSON
   └─ Persistencia

# config.py - Configuración
├─ ZMQ_ADDRESS = "tcp://127.0.0.1:5555"
├─ REDIS_HOST = "localhost"
├─ REDIS_PORT = 6379
├─ REDIS_CHANNEL = "signals"
└─ ARBITRAGE_THRESHOLD = 0.005 (0.5%)

# asyncio + uvloop
├─ Event Loop: asyncio (Windows) o uvloop (Linux)
├─ Tasks: ZMQ listener + Engine loop
├─ Queue: asyncio.Queue(maxsize=10_000)
└─ Non-blocking I/O
```

**Archivos**:
- `main.py` (75 líneas)
- `zmq_pull.py` (35 líneas)
- `orderbook.py` (10 líneas)
- `strategy.py` (20 líneas)
- `redis_pub.py` (10 líneas)
- `config.py` (10 líneas)

**Tests**:
- ✅ `test_dual_exchange_latency.py` (PASS: 2.1ms)

---

### 3️⃣ Frontend Dashboard

**Responsabilidad**: Visualizar datos en tiempo real

```html
<!-- index.html -->
├─ Header
│  ├─ Logo + Status
│  └─ Animación de pulso
│
├─ KPI Cards (4)
│  ├─ Latencia
│  ├─ Signals
│  ├─ Spread
│  └─ Ticks/s
│
├─ Gráficos (Chart.js)
│  ├─ Spreads (línea)
│  ├─ Latencia P50/P99 (dual-line)
│  └─ Distribución (histograma)
│
├─ Exchanges Status
│  ├─ Binance
│  └─ Kraken
│
├─ Signals Table
│  └─ Últimas 10
│
├─ Info Educativa
│  └─ Concepto teórico
│
└─ Footer
   └─ Estadísticas
```

```javascript
// main.js
├─ CONFIG
│  ├─ updateInterval: 1000ms
│  ├─ maxHistoryPoints: 60
│  └─ mockMode: true (fake data)
│
├─ STATE
│  ├─ signals[]
│  ├─ spreads[]
│  ├─ latencies[]
│  └─ prices{binance, kraken}
│
├─ CHARTS (Chart.js)
│  ├─ Spread Chart
│  ├─ Latency Chart
│  └─ Distribution Chart
│
├─ MOCK DATA
│  ├─ generateMockSignal()
│  ├─ updateChartsData()
│  └─ updatePrices()
│
└─ SOCKET.IO
   ├─ connect()
   ├─ on('signal')
   ├─ on('price_update')
   └─ on('latency_update')
```

```css
/* style.css */
├─ Variables CSS (colores, spacing)
├─ Grid + Flexbox
├─ Gradientes
├─ Animaciones
├─ Responsive (3 breakpoints)
└─ Chart styling
```

**Archivos**:
- `index.html` (464 líneas)
- `css/style.css` (548 líneas)
- `js/main.js` (400 líneas)
- `server.js` (70 líneas) - Express + Socket.io

---

### 4️⃣ Infraestructura

**Docker Compose**:
```yaml
services:
  - redis:7-alpine
    └─ PUB/SUB + Persistencia
  
  - ingestor
    └─ Node.js 20-alpine
  
  - quant-engine
    └─ Python 3.14-slim + uvloop
  
  - frontend
    └─ Node.js 20-alpine + Express
```

**Network**: bridge (arbitrage-net)
**Volumes**: redis_data

---

## Flujos de Datos Detallados

### Flujo 1: Ingesta de Datos

```
Binance WS tick
    │
    ▼
{exchange: "BINANCE", price: 42000.50}
    │
    ▼
zmq.send(JSON) ─────────────────┐
                                 │
Kraken WS tick                   │
    │                            │
    ▼                            │
{exchange: "KRAKEN", price: ...} │
    │                            │
    ▼                            │
zmq.send(JSON) ─────────────────┤
                                 │
                    ┌────────────┴─────────┐
                    │                      │
                    ▼                      ▼
            ZMQ Buffer        Network Socket
                                   │
                                   ▼
                            tcp://127.0.0.1:5555
```

### Flujo 2: Procesamiento

```
ZMQ recv_json (blocking)
    │
    ▼ (executor)
asyncio.Queue.put()
    │
    ▼
quant_engine_loop
    ├─ orderbook.update()
    ├─ prices = snapshot()
    ├─ signal = strategy.evaluate()
    │
    └─ if signal:
        ├─ redis_pub.publish()
        └─ logger.info()
```

### Flujo 3: Frontend

```
Redis channel: "signals"
    │
    ▼
Socket.io subscriber
    │
    ▼
io.emit('signal', data)
    │
    ▼
Frontend JS
    ├─ addSignalRow()
    ├─ updateCharts()
    └─ updateKPIs()
        │
        ▼
    Browser Render
```

---

## Comunicación Inter-Procesos

| Canal | Tipo | Protocolo | Latencia |
|-------|------|-----------|----------|
| Node → Python | ZMQ PUSH/PULL | Binary/JSON | <1ms |
| Python → Frontend | Redis PUB | JSON | 1-2ms |
| Frontend ← Backend | WebSocket | JSON | 5-10ms |

---

## Medición de Latencia

```
t0 = recv(ZMQ)
  ├─ zmq_pull.recv_json()
  └─ queue.put()

t1 = orderbook.update() + strategy.evaluate()

t2 = publish(redis)
  └─ latency = t2 - t0
```

**Resultado**: 2.1ms promedio (1.1ms - 3.1ms)

---

## Scalability

**Actual (MVP)**:
- 20-30 ticks/segundo
- 2 exchanges
- Memoria: ~100MB (Python) + ~200MB (Node)

**Mejoras futuras**:
- [ ] N exchanges
- [ ] Clustering
- [ ] Load balancing
- [ ] Caché distribuida

---

## Seguridad

- ✅ Localhost only (127.0.0.1)
- ✅ No API keys expuestas
- ✅ Redis sin autenticación (internal)
- ✅ ZMQ sin autenticación (internal)

**Producción**:
- [ ] SSL/TLS para WebSocket
- [ ] Autenticación Redis
- [ ] Rate limiting
- [ ] Input validation

---

## Performance Optimizations

| Aspecto | Técnica |
|--------|---------|
| Event Loop | uvloop (2-4x más rápido) |
| IPC | ZeroMQ (microsegundos) |
| Parsing | JSON (nativo) |
| Storage | OrderBook en memoria |
| Frontend | Chart.js + vanilla JS |

---

## Debugging

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Conectar a Redis
redis-cli
> SUBSCRIBE signals

# Monitorear ZMQ
python zmq_producer.py  # En otra terminal

# Testear latencia
python test_dual_exchange_latency.py
```

---

¡Arquitectura lista para escalar! 🚀
