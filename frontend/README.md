# 📊 The Arbitrage Sniper - Dashboard Frontend

Dashboard estadístico en tiempo real para el motor de arbitraje HFT.

## 🎨 Características

- **Dashboard Completo**
  - 4 KPI Cards (Latencia, Signals, Spread, Ticks/s)
  - Gráficos en tiempo real con Chart.js
  - Tabla de signals históricos
  - Estado de exchanges (Binance + Kraken)
  - Información teórica y educativa

- **Temática Estadística**
  - Diseño moderno con paleta cibernética
  - Colores: Cyan (#00d4ff), Verde (#51cf66), Rojo (#ff6b6b)
  - Animaciones suaves y responsive
  - Modo oscuro por defecto

- **Gráficos**
  - **Spreads**: Línea del spread histórico
  - **Latencia**: P50 vs P99 en tiempo real
  - **Distribución**: Barras de frecuencia de spreads
  - Actualización cada 1 segundo en modo demo

## 🚀 Arranque

### Opción 1: Desarrollo Local

```bash
cd frontend
npm install
npm start
```

Accede a: `http://localhost:3000`

### Opción 2: Docker

```bash
docker-compose up --build
```

## 📁 Estructura

```
frontend/
├── index.html          # Dashboard HTML (464 líneas)
├── css/
│   └── style.css       # Estilos (548 líneas)
├── js/
│   └── main.js         # Lógica y gráficos (400 líneas)
├── server.js           # Servidor Express + Socket.io
└── package.json        # Dependencias
```

## 🔌 Conexión Backend

El dashboard se conecta a través de:

1. **Socket.io** - Eventos en tiempo real
2. **Redis PUB/SUB** - Suscripción a channel `signals`

### Eventos Esperados

```javascript
// Signal recibida
socket.on('signal', (data) => {
    // { time, action, spread, buy, sell, latency }
});

// Actualización de precios
socket.on('price_update', (data) => {
    // { binance, kraken, timestamp }
});

// Latencia actualizada
socket.on('latency_update', (data) => {
    // { p50, p99, timestamp }
});
```

## 🎯 Modo Demo

Por defecto, el dashboard funciona en **modo demo** (mock data):

```javascript
CONFIG.mockMode = true  // Generar datos fake
```

Para activar modo **LIVE**, cambia a:

```javascript
CONFIG.mockMode = false  // Conectar a backend real
```

## 📊 Datos Mostrados

### KPI Cards
- **Latencia Interna**: P50 en ms (target <5ms)
- **Signals Emitidas**: Cantidad de signals/hora
- **Spread Promedio**: % actual del spread
- **Ticks/Segundo**: Velocidad de ingesta

### Gráficos
- Spreads históricos (últimos 60 puntos)
- Latencia P50/P99 (últimos 60 puntos)
- Distribución de spreads (histograma)

### Tabla de Signals
- Última hora (máx 10 señales)
- Información: hora, acción, spread, exchanges, latencia

### Exchanges Status
- Precio actual BTC/USDT
- Última actualización
- Latencia WebSocket

## 🎨 Paleta de Colores

```css
--primary: #00d4ff        /* Cyan */
--success: #51cf66        /* Verde */
--warning: #ffd43b        /* Amarillo */
--danger: #ff6b6b         /* Rojo */
--dark: #1a1a2e           /* Fondo */
--light: #eaeaea          /* Texto */
```

## ⚡ Performance

- **CSS**: 548 líneas optimizadas
- **JS**: 400 líneas sin dependencias externas (Chart.js via CDN)
- **Animations**: GPU-accelerated (transform + opacity)
- **Responsivo**: Mobile, Tablet, Desktop

## 🔧 Dependencias

- **express** - Servidor web
- **socket.io** - Comunicación real-time
- **redis** - Lectura de signals
- **cors** - CORS middleware
- **chart.js** (CDN) - Gráficos

## 📖 Concepto Educativo

El dashboard incluye una sección educativa que explica:

1. **¿Qué es el Arbitraje?**
2. **Flujo de Ejecución**
3. **Importancia de la Latencia**
4. **Spread Mínimo Rentable**

## 🌐 Responsive Design

- **Desktop**: Grid 2-4 columnas
- **Tablet**: Grid 1-2 columnas
- **Mobile**: Stack vertical

## 📝 Próximas Mejoras

- [ ] Filtros por rango de fechas
- [ ] Exportar datos a CSV
- [ ] Alertas sonoras para signals
- [ ] Tema claro/oscuro toggle
- [ ] Predicciones ML de spreads
- [ ] Backtesting visualización

## 📄 Licencia

MIT
