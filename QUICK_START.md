# 🚀 QUICK START - Arbitrage Sniper Dashboard

## ¿Qué necesitas?

- ✅ Node.js 20+
- ✅ Python 3.10+
- ✅ Redis 7 (opcional - el sistema funciona sin él)
- ✅ Docker (recomendado)

---

## 🎯 Opción 1: DOCKER (Recomendado)

### Paso 1: Iniciar todos los servicios

```bash
# En la carpeta raíz del proyecto
docker-compose up --build

# Salida esperada:
# redis              | Ready to accept connections
# ingestor           | ✓ Conectado a ZMQ
# quant-engine       | ✓ Motor de arbitraje iniciado
# frontend           | 🚀 Dashboard servidor en http://localhost:3000
```

### Paso 2: Acceder al dashboard

```
http://localhost:3000
```

**¡Eso es! El dashboard se conectará automáticamente y empezará a mostrar datos.**

---

## 🎯 Opción 2: LOCAL (3 Terminales)

### Terminal 1: Iniciar Redis

```bash
redis-server
# Output: Ready to accept connections on port 6379
```

### Terminal 2: Iniciar Ingestor (Node.js)

```bash
cd ingestor
npm install
node src/index.js

# Output esperado:
# ✓ Conectado a Binance WebSocket
# ✓ Conectado a Kraken WebSocket
# ✓ Conectado a ZMQ PUSH
# 📨 Tick: BINANCE 42150.50
# 📨 Tick: KRAKEN 42360.00
```

### Terminal 3: Iniciar Quant Engine (Python)

```bash
cd quant-engine
pip install -r ../requirements.txt
python src/main.py

# Output esperado:
# 🚀 Quant Engine iniciado
# ⏳ Esperando ticks en ZMQ...
# 📊 OrderBook actualizado: BINANCE=42150.50 KRAKEN=42360.00
# 🎯 SIGNAL: Comprar en BINANCE, Vender en KRAKEN (spread: 0.50%)
```

### Terminal 4: Iniciar Frontend (Node.js)

```bash
cd frontend
npm install
npm start

# Output esperado:
# ✅ Conectado a Redis
# 📢 Suscrito a canal Redis: signals
# 🚀 Dashboard servidor en http://localhost:3000
```

### Paso 5: Acceder al dashboard

```
http://localhost:3000
```

---

## 📊 ¿Qué verás en el Dashboard?

```
╔════════════════════════════════════════════════════════════════╗
║                    ARBITRAGE SNIPER DASHBOARD                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  📊 KPI Cards (superior):                                      ║
║  ├─ Latencia P50: 1.1 ms ⏱️                                   ║
║  ├─ Signals Detectadas: 123 🎯                               ║
║  ├─ Spread Máximo: 0.85% 📈                                  ║
║  └─ Ticks Procesados: 45,230 📨                             ║
║                                                                ║
║  📈 Gráficos (centro):                                         ║
║  ├─ Spread histórico (últimos 60s)                           ║
║  ├─ Latencia P50 vs P99                                      ║
║  └─ Distribución de latencias                                ║
║                                                                ║
║  📋 Exchange Status:                                           ║
║  ├─ Binance: ✓ CONECTADO                                     ║
║  └─ Kraken: ✓ CONECTADO                                      ║
║                                                                ║
║  🎯 Últimas Signals:                                          ║
║  ├─ 14:32:45 | COMPRA/VENTA | Spread: 0.52% | Lat: 1.2ms   ║
║  ├─ 14:32:30 | COMPRA/VENTA | Spread: 0.68% | Lat: 1.5ms   ║
║  └─ 14:32:15 | WAIT | Spread: 0.30% | Lat: 0.9ms           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔍 Ver Logs en Tiempo Real

### Logs del Backend (Python)

```bash
# Si usas Docker
docker-compose logs -f quant-engine

# Si usas local
# (ya ves los logs en la terminal 3)
```

### Logs del Ingestor (Node)

```bash
# Si usas Docker
docker-compose logs -f ingestor

# Si usas local
# (ya ves los logs en la terminal 2)
```

### Logs del Frontend (Browser)

```bash
# Abre DevTools en el navegador (F12)
# Ve a la pestaña "Console"

# Verás logs como:
# ✅ CONECTADO al backend
# 📨 Precio actualizado: {binance: 42150, kraken: 42360}
# 🎯 SIGNAL RECIBIDA: {buy: "BINANCE", sell: "KRAKEN", spread: 0.50}
# ⏱️ Latencia actualizada: {p50: 1.1, p99: 3.1}
```

---

## 🧪 Testing

### Test 1: Verificar Conexión Backend ↔ Frontend

```bash
# En la consola del navegador (F12):
socket.emit('test', {message: 'hello'});

# En los logs del frontend deberías ver la prueba procesada
```

### Test 2: Verificar Redis (opcional)

```bash
# En otra terminal
redis-cli

# Dentro de redis-cli
SUBSCRIBE signals

# Verás signals en tiempo real:
# Reading messages... (press Ctrl-C to quit)
# 1) "message"
# 2) "signals"
# 3) "{\"buy\":\"BINANCE\",\"sell\":\"KRAKEN\",\"spread\":0.5}"
```

### Test 3: Verificar ZMQ

```python
# En Python, dentro de quant-engine/src/test_integration.py
python test_quant_engine_integration.py

# Output:
# ✅ Tick recibido correctamente
# ✅ OrderBook actualizado
# ✅ Strategy ejecutada
# ✅ Signal generada
# Test: PASSED
```

---

## ⚙️ Configuración

### Cambiar Threshold de Spread

En `quant-engine/src/config.py`:

```python
SPREAD_THRESHOLD = 0.5  # % (cambiar según necesidad)
```

### Cambiar Puertos

En `docker-compose.yml` o archivos respectivos:

```yaml
# Redis
- "6379:6379"

# Frontend
- "3000:3000"

# ZMQ (interno)
tcp://127.0.0.1:5555
```

### Cambiar Exchanges

En `ingestor/src/index.js`:

```javascript
const binanceWS = new BinanceWS({
    symbol: 'btcusdt'  // Cambiar símbolo
});

const krakenWS = new KrakenWS({
    pair: 'XBT/USDT'  // Cambiar par
});
```

---

## 🚨 Troubleshooting

### "Connection refused en puerto 5555"
```bash
# Problema: ZMQ no se está ejecutando
# Solución: Asegúrate que el Ingestor está corriendo (Terminal 2)
docker-compose logs ingestor
```

### "No llegan signals al frontend"
```bash
# Verificar que el spread es >= 0.5%
# El simulador no genera signals si spread < 0.5%

# Aumentar spread threshold en config.py para testing:
SPREAD_THRESHOLD = 0.3  # Más bajo para más señales
```

### "Redis Error: connection refused"
```bash
# Problema: Redis no está corriendo
# Solución 1: Iniciar Redis
redis-server

# Solución 2: El sistema funciona sin Redis (con simulador)
# No es necesario para testing básico
```

### "npm install no funciona en PowerShell"
```bash
# Solución 1: Usar CMD o Terminal de Git Bash
cmd
cd frontend
npm install

# Solución 2: Usar Docker (más simple)
docker-compose up --build
```

### "Node.js no instalado"
```bash
# Descargar de: https://nodejs.org/
# Versión recomendada: 20 LTS
# Verificar instalación:
node --version
npm --version
```

### "Python no instalado"
```bash
# Descargar de: https://www.python.org/
# Versión recomendada: 3.10+
# Verificar instalación:
python --version
pip --version
```

---

## 📊 Datos Simulados vs Reales

### Modo SIMULADO (Sin backend real)

```
Dashboard funciona sin necesidad de:
- Binance WebSocket
- Kraken WebSocket
- Python Engine

Genera:
✓ Precios realistas (±0.3% cada 500ms)
✓ Latencias realistas (0.5-5ms)
✓ Spreads variables (0-2%)
✓ Signals cuando spread >= 0.5%
```

### Modo REAL (Con backend completo)

```
Dashboard recibe datos reales de:
✓ Binance BTC/USDT trades
✓ Kraken XBT/USDT ticker
✓ Quant Engine arbitrage detection
✓ Latencias medidas en nanosegundos
```

---

## 🎯 Próximos Pasos

1. **Prueba el dashboard** - Accede a `http://localhost:3000`
2. **Monitorea logs** - Abre múltiples terminales para ver todo
3. **Experimenta** - Cambia threshold, pares, etc.
4. **Deploy** - Usa docker-compose en producción
5. **Integra** - Conecta con tu sistema de trading real

---

## 📚 Documentación Completa

- [INTEGRATION.md](./INTEGRATION.md) - Flujo de datos detallado
- [ARCHITECTURE.md](./Readmes/1-arqutectura-backend.md) - Arquitectura completa
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Estado actual del proyecto
- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - Guía visual del dashboard

---

## ✨ Resumen

```
Frontend:     http://localhost:3000
Backend:      tcp://127.0.0.1:5555 (ZMQ)
Redis:        localhost:6379
Binance:      wss://stream.binance.com:9443/ws/btcusdt@trade
Kraken:       wss://ws.kraken.com (XBT/USDT)

Status:       ✅ INTEGRACIÓN COMPLETA
Dashboard:    ✅ FUNCIONANDO
Datos:        ✅ REALES (O SIMULADOS)
```

---

¡Listo para hacer trading de arbitraje! 🚀
