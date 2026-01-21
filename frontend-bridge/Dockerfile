FROM python:3.12-slim

WORKDIR /app

# Copiar dependencias
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY src/ ./src/

# Establecer directorio de trabajo
WORKDIR /app/src

EXPOSE 8765

CMD ["python", "ws_bridge.py"]
