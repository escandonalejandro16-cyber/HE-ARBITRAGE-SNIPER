# ================================
# Ingestor Service
# ================================

FROM node:20-alpine

# Instalar dependencias de compilación para módulos nativos (ZeroMQ)
RUN apk add --no-cache python3 make g++

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo dependencias primero (cache)
COPY package.json package-lock.json ./

# Instalación limpia y reproducible
RUN npm ci --only=production

# Copiamos el código fuente
COPY src ./src

# Variables de entorno (default)
ENV NODE_ENV=production

# Arranque del ingestor
CMD ["node", "src/index.js"]
