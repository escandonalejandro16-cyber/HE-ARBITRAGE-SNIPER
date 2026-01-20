# Endpoints API - HE-ARBITRAGE-SNIPER

## 📋 Descripción General

El sistema envía datos **continuamente** desde el quant-engine al API en un bucle. Cada vez que se recibe un tick, se actualizan precios y métricas. Cuando se detecta una señal, se envía también al API.

## 🔄 Flujo de Datos

```
ZMQ (Ingestor)
    ↓
Queue (async)
    ↓
OrderBook (actualizado)
    ↓
Strategy (evaluado)
    ↓
📤 ENVÍA A ENDPOINTS:
    ├─ POST /api/ticks/add
    ├─ POST /api/prices/update
    ├─ POST /api/signals/add
    └─ POST /api/metrics/update
    ↓
DataStore (almacenado en memoria)
    ↓
📊 CONSUMO VÍA ENDPOINTS:
    ├─ GET /api/prices
    ├─ GET /api/signals
    ├─ GET /api/metrics
    └─ GET /api/status
```

## 📮 Endpoints POST (Reciben datos del engine)

### 1. POST `/api/ticks/add`
Recibe un tick completo con información de origen.

**Parámetros (JSON):**
```json
{
  "exchange": "BINANCE",
  "price": 42000.50,
  "_source": "ZMQ_LISTENER",
  "_address": "tcp://127.0.0.1:5555"
}
```

**Respuesta:**
```json
{
  "status": "ok",
  "tick": { ... }
}
```

---

### 2. POST `/api/prices/update`
Actualiza precio de un exchange con origen rastreado.

**Parámetros (Query):**
- `exchange` (str): "BINANCE", "KRAKEN", etc.
- `price` (float): Precio actual
- `source` (str): "ZMQ_LISTENER"
- `address` (str): "tcp://127.0.0.1:5555"

**Ejemplo:**
```bash
POST /api/prices/update?exchange=BINANCE&price=42000.50&source=ZMQ_LISTENER&address=tcp://127.0.0.1:5555
```

**Respuesta:**
```json
{
  "status": "ok",
  "exchange": "BINANCE",
  "price": 42000.50,
  "source": "ZMQ_LISTENER",
  "address": "tcp://127.0.0.1:5555"
}
```

---

### 3. POST `/api/signals/add`
Recibe una señal de arbitraje detectada.

**Parámetros (JSON):**
```json
{
  "buy": "KRAKEN",
  "sell": "BINANCE",
  "spread": 0.5230,
  "_signal_number": 1,
  "_evaluation_number": 125,
  "_from_orderbook_source": {
    "exchange": "KRAKEN",
    "price": 42210.00,
    "source": "ZMQ_LISTENER",
    "address": "tcp://127.0.0.1:5555"
  }
}
```

**Respuesta:**
```json
{
  "status": "ok",
  "signal": { ... }
}
```

---

### 4. POST `/api/metrics/update`
Actualiza contadores de evaluaciones y señales.

**Parámetros (Query):**
- `evaluations` (int): Total de evaluaciones realizadas
- `signals` (int): Total de señales generadas

**Ejemplo:**
```bash
POST /api/metrics/update?evaluations=125&signals=3
```

**Respuesta:**
```json
{
  "status": "ok",
  "evaluations": 125,
  "signals": 3
}
```

---

## 📊 Endpoints GET (Consumen datos)

### 1. GET `/api/prices`
Obtiene todos los precios actuales con información de origen.

**Respuesta:**
```json
{
  "binance": {
    "price": 42000.50,
    "source": "ZMQ_LISTENER",
    "address": "tcp://127.0.0.1:5555",
    "timestamp": "2024-01-20T10:30:45.123456"
  },
  "kraken": {
    "price": 42210.00,
    "source": "ZMQ_LISTENER",
    "address": "tcp://127.0.0.1:5555",
    "timestamp": "2024-01-20T10:30:46.654321"
  },
  "prices_raw": {
    "BINANCE": { ... },
    "KRAKEN": { ... }
  }
}
```

---

### 2. GET `/api/prices/{exchange}`
Obtiene precio de un exchange específico.

**Ejemplo:**
```bash
GET /api/prices/BINANCE
```

**Respuesta:**
```json
{
  "price": 42000.50,
  "source": "ZMQ_LISTENER",
  "address": "tcp://127.0.0.1:5555",
  "timestamp": "2024-01-20T10:30:45.123456"
}
```

---

### 3. GET `/api/signals`
Obtiene últimas señales de arbitraje.

**Parámetros (Query):**
- `limit` (int, default=10): Cantidad de últimas señales

**Ejemplo:**
```bash
GET /api/signals?limit=5
```

**Respuesta:**
```json
{
  "count": 2,
  "signals": [
    {
      "buy": "KRAKEN",
      "sell": "BINANCE",
      "spread": 0.5230,
      "_signal_number": 1,
      "_evaluation_number": 125,
      "_from_orderbook_source": { ... },
      "timestamp": "2024-01-20T10:30:50.123456"
    },
    {
      "buy": "BINANCE",
      "sell": "KRAKEN",
      "spread": 0.6150,
      "_signal_number": 2,
      "_evaluation_number": 145,
      "_from_orderbook_source": { ... },
      "timestamp": "2024-01-20T10:31:05.654321"
    }
  ]
}
```

---

### 4. GET `/api/metrics`
Obtiene métricas completas del engine.

**Respuesta:**
```json
{
  "evaluations_total": 125,
  "signals_total": 2,
  "ticks_processed": 250,
  "uptime_seconds": 3600,
  "last_signal": {
    "buy": "BINANCE",
    "sell": "KRAKEN",
    "spread": 0.6150,
    "_signal_number": 2,
    "_evaluation_number": 145,
    "timestamp": "2024-01-20T10:31:05.654321"
  }
}
```

---

### 5. GET `/api/status`
Obtiene estado completo del sistema.

**Respuesta:**
```json
{
  "status": "running",
  "prices": {
    "binance": { "price": 42000.50, ... },
    "kraken": { "price": 42210.00, ... },
    "prices_raw": { ... }
  },
  "metrics": {
    "evaluations_total": 125,
    "signals_total": 2,
    "ticks_processed": 250,
    "uptime_seconds": 3600,
    "last_signal": { ... }
  },
  "recent_signals": [
    { ... },
    { ... }
  ]
}
```

---

### 6. GET `/api/health`
Health check del API.

**Respuesta:**
```json
{
  "status": "ok",
  "service": "quant-engine-api"
}
```

---

## 🚀 Uso

### Terminal 1 - Iniciar API
```bash
cd c:\Users\estudiante\Documents\Desarrollo\HE-ARBITRAGE-SNIPER
python run_api.py
```

### Terminal 2 - Iniciar Motor
```bash
cd quant-engine\src
python main.py
```

### Terminal 3 - Iniciar Ingestor (si no está corriendo)
```bash
cd ingestor
npm start
```

### Terminal 4 - Consumir datos
```bash
# Health check
curl http://localhost:8000/api/health

# Ver precios
curl http://localhost:8000/api/prices

# Ver señales
curl http://localhost:8000/api/signals?limit=5

# Ver métricas
curl http://localhost:8000/api/metrics

# Ver estado completo
curl http://localhost:8000/api/status
```

---

## 📊 Rastreo de Origen de Datos

Cada dato contiene información de dónde viene:

```
ZMQ LISTENER (origen)
└─ _source: "ZMQ_LISTENER"
└─ _address: "tcp://127.0.0.1:5555"

ORDERBOOK UPDATE
└─ source: [del tick]
└─ address: [del tick]

STRATEGY EVAL
└─ _evaluation_number: [número de evaluación]
└─ _signal_number: [número de signal]
└─ _from_orderbook_source: [información completa del tick]

API RESPONSE
└─ Incluye timestamp de cuándo se procesó
└─ Incluye toda la información de origen rastreada
```

---

## 🔄 Ciclo de Datos Completo

1. **Ingestor** → Conecta a Binance/Kraken WebSockets
2. **ZMQ Push** → Envía ticks a `tcp://127.0.0.1:5555`
3. **ZMQ Pull** → Recibe en engine, marca origen (`_source`, `_address`)
4. **Queue** → Almacena en cola async
5. **OrderBook** → Actualiza precios, registra fuente
6. **Strategy** → Evalúa spreads
7. **Signal** → Si hay spread, genera signal
8. **API POST** → Envía datos a FastAPI
9. **DataStore** → Almacena en memoria
10. **API GET** → Disponible para consumo en tiempo real

---

## 📈 Información Específica Retornada

| Componente | Información | Origen |
|------------|-------------|--------|
| **Tick** | exchange, price, _source, _address | ZMQ Listener |
| **Precio** | exchange, price, source, address, timestamp | OrderBook |
| **Signal** | buy, sell, spread%, signal#, eval# | Strategy |
| **Métrica** | evaluations, signals, ticks, uptime | Engine Loop |
| **Status** | Todos los anteriores + estado | Sistema completo |

---

## ⚙️ Configuración

**En `config.py`:**
```python
ZMQ_ADDRESS = "tcp://127.0.0.1:5555"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_CHANNEL = "arbitrage_signals"
```

**En `main.py`:**
```python
API_URL = "http://localhost:8000/api"  # URL del API
```

Si necesitas cambiar el puerto o host, edita estos valores.

---

**Estado:** ✅ Sistema de endpoints funcional
**Siguiente:** Ejecutar los 3 componentes en paralelo
