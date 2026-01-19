
# Quant Engine – Motor de Arbitraje Simulado

## 🏷 Descripción General

**Quant Engine** es un motor de arbitraje de alta frecuencia (HFT) simulado, desarrollado en **Python**.  
Permite detectar diferencias de precio entre dos exchanges simulados, generar señales de compra/venta y publicarlas en un canal Redis para consumo externo (por ejemplo, un frontend en Node.js o simulaciones de trading).

La arquitectura está diseñada para ser **event-driven y asíncrona**, utilizando `asyncio` en Windows, y es fácilmente migrable a **Docker/Linux con uvloop y zmq.asyncio** sin cambios estructurales.

---

## 📁 Estructura de Archivos

```

quant-engine/src/
├── main.py          # Motor principal: orquesta ZMQ, OrderBook, Strategy y Redis
├── zmq_pull.py      # Configuración del socket ZMQ PULL
├── orderbook.py     # Gestión de precios y snapshots de los exchanges
├── strategy.py      # Lógica de arbitraje y generación de señales
└── redis_pub.py     # Publicador de señales en Redis

```

---

## ⚙ Arquitectura General

```

[Exchange Simulado] ---> (ZMQ PUSH) ---> [main.py / zmq_listener] ---> asyncio.Queue ---> [OrderBook + Strategy] ---> RedisPublisher ---> [Frontend / Dashboard]

````

1. **ZMQ Listener**  
   - Escucha ticks de los exchanges (simulados o reales).  
   - Bloqueante por naturaleza, pero ejecutado en un **executor de asyncio** para no bloquear el loop principal.

2. **asyncio.Queue**  
   - Cola interna que desacopla la recepción de ticks del procesamiento de señales.  
   - Permite **procesamiento paralelo y event-driven** sin bloquear el motor.

3. **OrderBook**  
   - Mantiene un **snapshot actualizado de los precios** de cada exchange.  
   - Método `update(tick)` para actualizar precios.  
   - Método `snapshot()` para obtener estado actual.

4. **StrategyEngine**  
   - Evalúa los precios del OrderBook y detecta oportunidades de arbitraje.  
   - Genera una **señal de trading** con `buy`, `sell` y `spread`.

5. **RedisPublisher**  
   - Publica señales en un canal Redis (`signals`).  
   - Permite que sistemas externos consuman las señales en tiempo real.

---

## 🛠 Librerías Utilizadas

| Librería | Uso en el Proyecto |
|----------|------------------|
| `asyncio` | Loop asíncrono para gestión de tareas concurrentes y no bloqueantes. |
| `zmq` | Comunicación con exchanges simulados mediante sockets PUSH/PULL. |
| `redis` | Publicación de señales en tiempo real para consumidores externos. |
| `unittest` | Framework de testing asíncrono para validar comportamiento y latencias. |
| `datetime` | Medición de latencia real entre tick recibido y señal publicada. |

---

## 💡 Contexto y Decisiones de Diseño

- **Windows-Friendly**:  
  No se usa `zmq.asyncio` ni `uvloop` en desarrollo local Windows. Se mantiene asincronía con `asyncio + run_in_executor`.  

- **Escalable**:  
  La cola asíncrona (`asyncio.Queue`) permite añadir múltiples consumidores y productores sin reescribir la lógica central.  

- **HFT Style**:  
  - Latencia mínima: uso de `run_in_executor` para ZMQ bloqueante.  
  - Timestamps precisos y medición de latencias en milisegundos.  
  - Arquitectura lista para migración a Linux/Docker con `uvloop` para ultra-baja latencia.  

- **Testabilidad**:  
  - Tests unitarios (`orderbook`, `strategy`) y de integración (`ZMQ → Queue → Strategy → Redis`).  
  - Mock de Redis para pruebas locales sin depender de servidor real.  
  - Timestamps con microsegundos para benchmarking interno.  

---

## 🚀 Cómo Ejecutar

1. **Instalar dependencias**:
```bash
pip install pyzmq redis
````

2. **Ejecutar motor principal**:

```bash
python src/main.py
```

3. **Ejecutar tests**:

```bash
python -m unittest discover -s src
```

4. **Ver señales en tiempo real** (con Redis):

```bash
redis-cli subscribe signals
```

---

## 📌 Conclusión

Este motor HFT simulado sirve como **punto de partida profesional** para:

* Sistemas de arbitraje real-time.
* Benchmark de latencias y procesamiento asíncrono en Python.
* Arquitectura modular y extensible para agregar más exchanges, estrategias o consumidores de señales.



