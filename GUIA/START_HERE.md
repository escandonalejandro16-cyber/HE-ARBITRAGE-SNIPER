# 🎯 BIENVENIDO A ARBITRAGE SNIPER

## ¿Qué es esto?

**Arbitrage Sniper** es un motor de detección de arbitraje de alta frecuencia que:
- 📊 Monitorea BTC en Binance y Kraken en tiempo real
- 🎯 Detecta diferencias de precio (spreads) automáticamente
- ⚡ Procesa datos con latencia < 5ms
- 🎨 Visualiza todo en un dashboard interactivo

## 🚀 EMPEZAR EN 3 PASOS

### Paso 1: Verificar que tienes todo

```bash
bash validate.sh
```

Si todo aparece con ✅, continúa.

### Paso 2: Iniciar todo

```bash
docker-compose up --build
```

Espera a que veas:
```
frontend | 🚀 Dashboard servidor en http://localhost:3000
```

### Paso 3: Abrir el dashboard

Abre en tu navegador:
```
http://localhost:3000
```

¡Listo! Deberías ver el dashboard con gráficos en tiempo real.

---

## 📊 ¿Qué hay en el Dashboard?

```
┌─────────────────────────────────────────┐
│  ARBITRAGE SNIPER DASHBOARD             │
├─────────────────────────────────────────┤
│                                         │
│  📈 KPI Cards                          │
│  ├─ Latencia: 1.1 ms                  │
│  ├─ Signals: 245                       │
│  ├─ Max Spread: 0.85%                 │
│  └─ Ticks: 52,341                     │
│                                         │
│  📊 Charts                              │
│  ├─ Spread histórico                   │
│  ├─ Latencia P50/P99                  │
│  └─ Distribución                       │
│                                         │
│  🎯 Últimas Signals                    │
│  ├─ 14:32:45 COMPRA/VENTA 0.52%       │
│  ├─ 14:32:30 COMPRA/VENTA 0.68%       │
│  └─ ...                                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔍 Ver Logs

En otra terminal:

```bash
docker-compose logs -f
```

Verás en tiempo real:
- 📨 Ticks recibidos
- 💹 Precios actualizados  
- 🎯 Signals generadas
- ⏱️ Latencias medidas

---

## 📚 Documentación

| Documento | Qué es |
|-----------|--------|
| **[QUICK_START.md](./QUICK_START.md)** | ⭐ Guía completa (leyendo ahora) |
| **[INTEGRATION.md](./INTEGRATION.md)** | Cómo fluyen los datos |
| **[README.md](./README.md)** | Descripción técnica |
| **[CHANGELOG.md](./CHANGELOG.md)** | Cambios realizados |

---

## 🧪 Testing (Opcional)

Si quieres verificar que todo funciona:

```bash
# Test de latencia (Python)
python quant-engine/src/test_quant_engine_latency.py

# Test de integración (Python)
python quant-engine/src/test_quant_engine_integration.py
```

Deberías ver algo como:
```
✅ test_pull_socket_receives_message - PASSED
✅ test_orderbook_update - PASSED
✅ Latencia promedio: 1.1ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tests: 4/4 PASSED ✅
```

---

## ⚠️ Problemas Comunes

### Dashboard en blanco o sin datos

**Solución**: Abre DevTools (F12) y ve a la pestaña "Console"
- Si ves ✅ "CONECTADO al backend" → todo bien
- Si ves ❌ "Connection refused" → backend no está corriendo

### "Port 3000 already in use"

```bash
# Opción 1: Matar proceso en puerto 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Opción 2: Cambiar puerto en docker-compose.yml
# Cambiar "3000:3000" por "3001:3000"
```

### npm install no funciona

```bash
# En PowerShell Windows, usar cmd o Git Bash en su lugar
cmd
cd frontend
npm install
```

### Redis "connection refused"

No es obligatorio. El sistema funciona sin Redis:
- ✅ Dashboard mostrará datos simulados
- ✅ Todo funcionará normal
- ⚠️ Sin datos del backend real

---

## 🎛️ Personalización

### Cambiar Threshold de Arbitraje

Archivo: `quant-engine/src/config.py`

```python
SPREAD_THRESHOLD = 0.5  # Cambiar a 0.1 para más signals en testing
```

### Cambiar Exchanges

Archivo: `ingestor/src/index.js`

```javascript
// BTC/USD → ETH/USD
new BinanceWS({ symbol: 'ethusdt' });
new KrakenWS({ pair: 'ETH/USDT' });
```

### Cambiar Puerto del Dashboard

Archivo: `docker-compose.yml`

```yaml
frontend:
  ports:
    - "3001:3000"  # Cambiar a 3001
```

---

## 🔧 Componentes del Sistema

```
Node.js Ingestor
├─ Conecta a Binance WebSocket
├─ Conecta a Kraken WebSocket
└─ Envía precios via ZMQ

Python Quant Engine
├─ Recibe ticks via ZMQ
├─ Calcula spreads
├─ Detecta arbitraje
└─ Publica signals en Redis

Frontend Dashboard
├─ Recibe signals via Socket.io
├─ Visualiza en Charts
├─ Muestra KPIs
└─ Tabla de eventos

Simulador (Fallback)
├─ Si Redis no está disponible
├─ Genera datos realistas
└─ Funciona para testing
```

---

## 📊 Datos Reales vs Simulados

### Datos Reales
- ✅ De Binance + Kraken real-time
- ✅ Latencias exactas en nanosegundos
- ✅ Spreads del mercado actual
- ⚠️ Necesita backend corriendo

### Datos Simulados
- ✅ Realistas (±0.3% variación)
- ✅ Funcionan sin backend
- ✅ Perfectos para testing visual
- ✅ Activados automáticamente si falta Redis

---

## 📱 Acceso Remoto

Si quieres acceder desde otra máquina:

1. **En docker-compose.yml**, cambiar:
```yaml
frontend:
  ports:
    - "3000:3000"  # 0.0.0.0:3000
```

2. **Acceder desde otra máquina**:
```
http://tu-ip-del-servidor:3000
```

---

## 🚨 Debugging

### Ver logs en tiempo real
```bash
docker-compose logs -f quant-engine
docker-compose logs -f ingestor  
docker-compose logs -f frontend
```

### Conectar a Python container
```bash
docker-compose exec quant-engine python
```

### Conectar a Redis
```bash
docker-compose exec redis redis-cli
```

### Ver estado de contenedores
```bash
docker-compose ps
```

---

## 📈 Métricas Esperadas

Después de 1-2 minutos deberías ver:
- ✅ Número de signals aumentando
- ✅ Gráficos con líneas en movimiento
- ✅ Latencia P50 < 2ms
- ✅ Precios actualizándose
- ✅ Status "CONECTADO AL BACKEND"

---

## 🎓 Aprender Más

En el dashboard hay una sección "Información Educativa" que explica:
- Qué es arbitraje
- Cómo se calcula el spread
- Qué mide la latencia
- Cómo se generan signals

---

## 🆘 Ayuda

Si algo no funciona:

1. **Verificar logs**:
   ```bash
   docker-compose logs -f
   ```

2. **Abrir DevTools del navegador** (F12):
   - Console para ver errores de JavaScript
   - Network para ver Socket.io eventos

3. **Verificar puertos**:
   ```bash
   docker-compose ps  # ¿Todos corriendo?
   netstat -an | grep 3000  # ¿Puerto en uso?
   ```

4. **Leer documentación**:
   - [QUICK_START.md](./QUICK_START.md)
   - [INTEGRATION.md](./INTEGRATION.md)
   - [TROUBLESHOOTING](#troubleshooting)

---

## ✨ Casos de Uso

### 🎓 Aprendizaje
- Entender arbitraje de criptomonedas
- Ver cómo funciona HFT
- Aprender sobre latencia

### 🧪 Testing
- Probar estrategias de trading
- Monitorear spreads históricos
- Analizar patrones

### 📊 Monitoreo
- Dashboard en tiempo real
- Alertas de oportunidades
- Métricas del sistema

---

## 🚀 Siguiente Nivel

Cuando domines esto, puedes:
- ✅ Añadir más exchanges
- ✅ Implementar machine learning
- ✅ Deploy en producción
- ✅ Integrar con API de trading real
- ✅ Crear alertas automáticas

---

## 📋 Resumen Quick

```
¿Qué hay que hacer?
1. bash validate.sh
2. docker-compose up --build
3. http://localhost:3000

¿Qué ves?
- Dashboard con datos en tiempo real
- Gráficos actualizándose
- Tabla de signals

¿Algo no funciona?
- Ver logs: docker-compose logs -f
- Abrir DevTools: F12
- Leer: QUICK_START.md
```

---

## 🎉 ¡Listo!

Tienes un sistema profesional de detección de arbitraje.

**¡Ahora enfócate en mejorar la estrategia!** 🚀

---

### Comandos Útiles

```bash
# Iniciar
docker-compose up --build

# Logs
docker-compose logs -f

# Parar
docker-compose down

# Limpiar todo
docker-compose down -v

# Tests
python quant-engine/src/test_quant_engine_latency.py

# Validar
bash validate.sh
```

---

Made with ❤️ for Trading & Arbitrage

**Arbitrage Sniper v1.0 - Integration Complete** ✨
