FROM python:3.12-slim

WORKDIR /app

# Copiar dependencias e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY src/ ./src/

# Establecer directorio de trabajo en src para facilitar imports y ejecución
WORKDIR /app/src

ENV PYTHONUNBUFFERED=1

# Ejecutar el motor (asegúrate de que main.py exista en src/)
CMD ["python", "main.py"]