# 🧠 Guía Técnica Avanzada & FAQ (Senior Level)

> **Contexto:** Este documento profundiza en las decisiones de arquitectura, compensaciones (trade-offs) y detalles de implementación del sistema **Arbitrage Sniper**. Diseñado para ingenieros que buscan entender la ingeniería detrás de un sistema de baja latencia.

---

### 1. ¿Por qué se eligió ZeroMQ (PUSH/PULL) sobre protocolos estándar como HTTP/REST o gRPC?
**R:** En sistemas de Alta Frecuencia (HFT), el overhead de HTTP (handshakes TCP, headers extensos, parsing de texto) es inaceptable.
*   **ZeroMQ** nos permite comunicación asíncrona sobre TCP (o IPC) sin un broker central pesado (brokerless).
*   El patrón **PUSH/PULL** crea un pipeline unidireccional de alto rendimiento: el Ingestor "empuja" datos tan rápido como llegan, y el Quant Engine los "jala" a su propio ritmo. Esto desacopla la ingesta del procesamiento, permitiendo que el Ingestor no se bloquee si el motor de trading sufre un pico de carga (backpressure natural mediante buffers en memoria).

### 2. ¿Cuál es el impacto real de usar `uvloop` en el servicio de Python y por qué es crítico?
**R:** Python estándar usa `asyncio` con un event loop escrito en Python puro, lo cual es suficiente para I/O web pero lento para HFT.
*   **`uvloop`** es un reemplazo drop-in escrito en Cython sobre **libuv** (la misma librería que potencia Node.js).
*   Al activarlo en `main.py`, reducimos el overhead del context switching y el manejo de descriptores de archivo, haciendo que el loop de Python sea **2-4x más rápido**, acercándose al rendimiento de Go o Node.js. Esto es vital para procesar miles de ticks por segundo con latencia de microsegundos.

### 3. ¿Cómo se garantiza la consistencia del Order Book en memoria sin transacciones de Base de Datos?
**R:** La consistencia se logra mediante el modelo de concurrencia de **un solo hilo (Single-Threaded Event Loop)** de `asyncio`.
*   A diferencia del multithreading tradicional (donde se requieren Locks/Mutexes costosos), en `asyncio` las corrutinas ceden el control cooperativamente.
*   El procesamiento de un tick (actualizar OrderBook -> Evaluar Estrategia) ocurre de manera síncrona y atómica dentro del loop. Nunca hay dos ticks modificando el diccionario `self.prices` simultáneamente, eliminando condiciones de carrera (Race Conditions) sin sacrificar velocidad.

### 4. ¿Por qué se utiliza `float` para los precios en lugar de `Decimal`, sabiendo los problemas de precisión en finanzas?
**R:** Es un **Trade-off (Compromiso)** consciente entre Precisión y Velocidad.
*   **`Decimal`** ofrece precisión arbitraria pero es implementado por software y es significativamente más lento.
*   **`float`** (IEEE 754) es acelerado por hardware (CPU/FPU).
*   En detección de arbitraje de alta frecuencia, la velocidad de cálculo del spread es prioritaria. Un error de redondeo en el decimal 15 es irrelevante si la oportunidad de arbitraje desaparece en 1ms. Para la ejecución real de órdenes (fase de liquidación), sí usaríamos `Decimal`, pero para la detección (fase de señal), `float` es superior.

### 5. El Ingestor implementa un "Watchdog". ¿Qué fallo específico mitiga este patrón?
**R:** Mitiga los **"Fallos Silenciosos" (Silent Failures)** de los WebSockets.
*   A veces, una conexión WebSocket permanece "abierta" a nivel TCP, pero el servidor del Exchange deja de enviar datos (zombie connection).
*   El Watchdog en `index.js` monitorea el tiempo desde el último tick (`lastTickTime`). Si supera los 60 segundos, no intenta reconectar suavemente; asume un estado corrupto y ejecuta `process.exit(1)`. Esto delega la recuperación a la política de orquestación de Docker (`restart: unless-stopped`), garantizando un reinicio limpio del proceso y la memoria.

### 6. ¿Por qué desacoplar el Frontend del Motor usando Redis Pub/Sub en lugar de conectar el navegador directo a ZeroMQ?
**R:** Por dos razones fundamentales: **Compatibilidad** y **Aislamiento**.
1.  **Compatibilidad:** Los navegadores no soportan ZeroMQ ni sockets TCP crudos; solo hablan WebSockets.
2.  **Aislamiento (Backpressure):** Si conectáramos el servidor de WebSockets directamente al Quant Engine, un cliente lento (navegador colgado) podría bloquear o ralentizar el motor de trading. Redis actúa como un buffer intermedio. El motor "dispara y olvida" (Fire-and-Forget) a Redis, y el `frontend-bridge` se encarga de la distribución masiva a los clientes UI.

### 7. ¿Cómo se mide la latencia interna de "<5ms" reportada en el sistema?
**R:** Mediante **Propagación de Timestamps**.
*   El Ingestor marca el tiempo de llegada (`_received_ns`) en nanosegundos.
*   Este metadato viaja adjunto al objeto JSON a través de ZMQ y el procesamiento del motor.
*   Al momento de generar la señal, se compara `tiempo_actual - _received_ns`.
*   Esto mide la latencia real del pipeline completo (Ingesta -> Serialización -> Transporte ZMQ -> Deserialización -> Lógica de Negocio), no solo el ping de red.

### 8. ¿Qué implicaciones de seguridad tiene bindear los servicios a `0.0.0.0` dentro de Docker?
**R:** Dentro del contexto de una red Docker (`arbitrage-net`), es seguro y necesario.
*   `127.0.0.1` dentro de un contenedor es su propia interfaz de loopback, invisible para otros contenedores.
*   `0.0.0.0` permite recibir tráfico de la red interna de Docker.
*   **Seguridad:** La seguridad se mantiene porque en `docker-compose.yml` **no exponemos** los puertos críticos (5556 de ZMQ) al host (máquina física), solo exponemos el puerto 3000 (Web) y 8765 (WS). El tráfico ZMQ permanece aislado en la red virtual privada.

### 9. ¿Cómo escalaría esta arquitectura si tuviéramos que monitorear 500 pares de criptomonedas?
**R:** La arquitectura actual es monolítica en su procesamiento. Para escalar horizontalmente:
1.  **Sharding de Ingestors:** Crear múltiples contenedores Ingestor, cada uno suscrito a un subconjunto de pares (ej. `ingestor-btc`, `ingestor-eth`).
2.  **Sharding de Motores:** Similarmente, múltiples `quant-engines` escuchando en puertos ZMQ distintos.
3.  **Redis como Bus Central:** Redis ya está preparado para esto. Todos los motores publicarían al mismo canal `signals`, y el Frontend recibiría todo unificado sin cambios en su código.

### 10. ¿Por qué la estrategia simula datos de Kraken cuando falta el feed real?
**R:** Para garantizar la **Observabilidad** y el desarrollo iterativo.
*   En sistemas distribuidos, la ausencia de datos es difícil de depurar (¿es la red? ¿es el código? ¿es el exchange?).
*   Al inyectar datos sintéticos en `strategy.py` cuando falta un feed, validamos que el pipeline completo (ZMQ -> Engine -> Redis -> UI) funciona correctamente. Esto permite a los desarrolladores frontend trabajar en la UI incluso si la API de Kraken está caída o bloqueada por rate-limits.

---
> *Documento generado por Gemini Code Assist - Senior Software Architect Persona.*