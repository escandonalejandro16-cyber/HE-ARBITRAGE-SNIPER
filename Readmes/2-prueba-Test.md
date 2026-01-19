

## 🧪 Tests – Validación del Motor Quant Engine

Dentro de `quant-engine/src/` hemos añadido un **test de integración funcional** usando `unittest` asíncrono, que permite validar el flujo **tick → OrderBook → Strategy → RedisPublisher**.

### Archivo de Test: `test_quant_engine.py`

**Objetivo:**
Verificar que los ticks se procesen correctamente y que el motor genere señales de arbitraje sólo cuando corresponde.

**Librerías utilizadas:**

| Librería         | Uso                                                                |
| ---------------- | ------------------------------------------------------------------ |
| `asyncio`        | Permite tests asíncronos simulando la cola de ticks.               |
| `unittest`       | Framework estándar de testing en Python.                           |
| `unittest.mock`  | Para mockear RedisPublisher y evitar depender de un servidor real. |
| `OrderBook`      | Mantiene snapshot de precios de los exchanges.                     |
| `StrategyEngine` | Evalúa oportunidades de arbitraje.                                 |
| `RedisPublisher` | Mock para capturar señales publicadas.                             |

---

### 📋 Qué hace el test

#### 1️⃣ `test_tick_processing_no_signal`

* Envía un tick de un solo exchange (`A`).
* Actualiza el OrderBook con ese tick.
* Evalúa la estrategia.
* **Validaciones:**

  * El snapshot del OrderBook contiene sólo el precio de `A`.
  * No se genera ninguna señal (`signal is None`).
  * No se publica nada en Redis mock.

#### 2️⃣ `test_tick_processing_with_signal`

* Envía dos ticks de exchanges distintos (`A` y `B`) con diferencia de precio suficiente para generar arbitraje (>0.5%).
* Actualiza OrderBook con cada tick y evalúa la estrategia.
* Publica la señal en un Redis mock (`DummyRedisPublisher`) si se detecta arbitraje.
* **Validaciones:**

  * Se publica exactamente **una señal**.
  * La señal contiene `buy`, `sell` y `spread`.
  * El `spread` cumple la condición mínima de arbitraje (>1%).

---

### 💡 Contexto y relevancia

1. Este test **simula el flujo real de ticks** sin depender de exchanges externos.
2. Permite verificar que la **lógica central de arbitraje funcione correctamente**.
3. El uso de `asyncio.Queue` refleja el comportamiento real del motor asíncrono.
4. `DummyRedisPublisher` evita dependencias externas y permite inspeccionar las señales publicadas.
5. Sirve como **base para tests de latencia y HFT-style**, antes de agregar ZMQ o integración con Redis real.

---

### 🔹 Cómo correr el test

```bash
python src/test_quant_engine.py
```

Salida esperada si todo pasa:

```
..
----------------------------------------------------------------------
Ran 2 tests in 0.05s

OK
```



---

## 🧪 Tests de Latencia – Medición Real HFT-Style

Dentro de `quant-engine/src/` hemos añadido un **test de integración asíncrono** que simula el flujo completo de ticks hasta la publicación de señales, incluyendo **medición de latencia en milisegundos**.

### Archivo de Test: `test_quant_engine_latency.py`

**Objetivo:**
Medir la latencia desde que un tick es recibido hasta que se publica una señal de arbitraje, simulando un **flujo HFT real**.

**Librerías utilizadas:**

| Librería         | Uso                                                            |
| ---------------- | -------------------------------------------------------------- |
| `asyncio`        | Permite tests asíncronos simulando la cola de ticks.           |
| `unittest`       | Framework estándar de testing en Python.                       |
| `datetime`       | Para generar timestamps timezone-aware y calcular latencia.    |
| `OrderBook`      | Mantiene snapshot actualizado de los precios de los exchanges. |
| `StrategyEngine` | Evalúa oportunidades de arbitraje y genera señales.            |

---

### 📋 Qué hace el test

1. **Ticks simulados**

   * Envía dos ticks de exchanges distintos (`A` y `B`) con diferencia suficiente para generar arbitraje (>0.5%).
   * Cada tick recibe un **timestamp real y timezone-aware** `_received_at`.

2. **Procesamiento**

   * Se procesa cada tick en el `OrderBook`.
   * Se evalúa la estrategia (`StrategyEngine`) para detectar arbitraje.
   * Se calcula la **latencia real en milisegundos** desde `_received_at` hasta el momento de publicación.

3. **Publicación de señal**

   * Se utiliza `DummyRedisPublisher` para capturar las señales y mostrar **prints en tiempo real**:

     ```text
     ➡️ Tick recibido: {...}
     📊 OrderBook snapshot: {...}
     📤 Señal publicada -> signals: {..., '_latency_ms': 0.345}
     ⏱ Latencia: 0.345 ms
     ```

4. **Validaciones**

   * Se asegura que al menos **una señal haya sido publicada**.
   * La señal contiene campos: `buy`, `sell`, `spread` y `_latency_ms`.
   * Permite validar **latencia interna** y correcto funcionamiento del flujo.

---

### 💡 Contexto y relevancia

* Este test simula el **flujo completo de un motor HFT** sin depender de exchanges reales ni Redis externo.
* Permite medir **tiempo de reacción interno** desde recepción del tick hasta publicación de señal.
* Incluye **prints detallados** para debugging y benchmarking.
* Sirve como base para la **integración real con ZMQ y Redis** en producción.

---

### 🔹 Cómo correr el test

```bash
python src/test_quant_engine_latency.py
```

Salida esperada (ejemplo):

```
➡️ Tick recibido: {'exchange': 'A', 'price': 100.0, '_received_at': datetime.datetime(...)}
➡️ Tick recibido: {'exchange': 'B', 'price': 101.0, '_received_at': datetime.datetime(...)}
📊 OrderBook snapshot: {'A': 100.0}
📊 OrderBook snapshot: {'A': 100.0, 'B': 101.0}
📤 Señal publicada -> signals: {'buy': 'A', 'sell': 'B', 'spread': 1.0, '_published_at': '20:45:12.123456', '_latency_ms': 0.345}
⏱ Latencia: 0.345 ms
```

---

### 🔹 Beneficio

* Este test proporciona **benchmark interno HFT**, verificando **latencia mínima de procesamiento**.
* Ayuda a identificar posibles cuellos de botella antes de integrar con **ZMQ real o Docker/Linux**.

---
Perfecto, este test es un **test de integración completo** que cubre todo el flujo de tu motor: **ZMQ → Queue → OrderBook → Strategy → Redis**.
Podemos documentarlo en el README de forma profesional así:

---

## 🔗 Test de Integración – Flujo Completo

Archivo: `test_quant_engine_integration.py`

**Objetivo:**
Verificar que **todo el motor funcione en conjunto** cuando se reciben ticks reales (simulados por ZMQ), se procesan en `OrderBook`, se evalúa la estrategia y se publican señales en Redis.

---

### 📋 Qué hace el test

1. **ZMQ Producer Simulado**

   * Envia ticks a través de un socket ZMQ PUSH a un puerto local (`127.0.0.1:5556`).
   * Cada tick simula un precio de un exchange diferente con spread suficiente para arbitraje (>0.5%).
   * Se ejecuta en un **hilo separado** para simular asincronía real.

2. **ZMQ Listener Asíncrono**

   * Escucha ticks de ZMQ PULL usando `run_in_executor` para no bloquear el event loop.
   * Coloca cada tick en una `asyncio.Queue` para procesamiento por el motor.

3. **Motor Quant Engine Asíncrono**

   * Toma los ticks de la `Queue`.
   * Actualiza el `OrderBook` con cada tick.
   * Evalúa la estrategia (`StrategyEngine`).
   * Publica señales en `DummyRedisPublisher` si se detecta arbitraje.

4. **Validaciones**

   * Se asegura que al menos **una señal haya sido publicada**.
   * La señal contiene campos: `buy`, `sell`, `spread`.
   * Verifica que todo el flujo ZMQ → Queue → Strategy → Redis funcione correctamente.

---

### 🛠 Librerías utilizadas

| Librería         | Uso                                                              |
| ---------------- | ---------------------------------------------------------------- |
| `asyncio`        | Gestiona la cola asíncrona y el motor de procesamiento de ticks. |
| `unittest`       | Framework de testing.                                            |
| `zmq`            | Comunicación PUSH/PULL simulando exchanges.                      |
| `threading`      | Ejecuta el productor de ticks en un hilo separado.               |
| `OrderBook`      | Mantiene snapshot de precios.                                    |
| `StrategyEngine` | Evalúa oportunidades de arbitraje.                               |
| `RedisPublisher` | Mock para capturar señales publicadas.                           |

---

### 🔹 Contexto y relevancia

* Este test **simula un mini entorno HFT completo**, incluyendo **producción y consumo de ticks**.
* Permite validar que la **arquitectura asíncrona** funcione correctamente con ZMQ en Windows.
* Sirve como **base para escalabilidad**, donde múltiples producers y consumers puedan integrarse sin bloquear el motor.
* Permite integrar posteriormente **Redis real** y pruebas de latencia en tiempo real.

---

### 🔹 Cómo correr el test

```bash
python src/test_quant_engine_integration.py
```

Salida esperada:

```
.
----------------------------------------------------------------------
Ran 1 test in 0.15s

OK
```

* `.` indica que el test pasó.
* Si falla, `unittest` muestra el traceback con el error exacto.

-
