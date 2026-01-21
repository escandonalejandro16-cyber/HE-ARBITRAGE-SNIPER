#!/bin/bash

# ============================================
# STARTUP SCRIPT - The Arbitrage Sniper
# ============================================
# Inicia todos los servicios en el orden correcto

set -e

echo "⚡ The Arbitrage Sniper - Startup Script"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar Docker
log_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker no instalado. Por favor instálalo primero."
    exit 1
fi
log_success "Docker detectado"

# Opción 1: Docker Compose
if [ "$1" = "docker" ]; then
    log_info "Iniciando con Docker Compose..."
    docker-compose up --build
    exit 0
fi

# Opción 2: Local (Development)
log_info "Iniciando en modo LOCAL..."
echo ""

# Terminal 1: Redis (opcional, si tienes Redis instalado)
log_info "1️⃣  Asegúrate de que Redis esté corriendo:"

log_info "   redis-server (en otra terminal)"
echo ""

# Terminal 2: Quant Engine
log_info "2️⃣  En Terminal 1, ejecuta:"
echo "   ${BLUE}cd quant-engine"
echo "   pip install -r ../requirements.txt"
echo "   python src/main.py${NC}"
echo ""

# Terminal 3: Ingestor
log_info "3️⃣  En Terminal 2, ejecuta:"
echo "   ${BLUE}cd ingestor"
echo "   npm install"
echo "   node src/index.js${NC}"
echo ""

# Terminal 4: Frontend
log_info "4️⃣  En Terminal 3, ejecuta:"
echo "   ${BLUE}cd frontend"
echo "   npm install"
echo "   npm start${NC}"
echo ""

log_success "Luego accede a: http://localhost:3000"
echo ""

# Mostrar info
echo "=========================================="
log_success "Sistema de Arbitraje Listo"
echo "=========================================="
echo ""
echo "🔌 Conexiones:"
echo "   • Backend Python: localhost:5555 (ZMQ)"
echo "   • Redis: localhost:6379 (PUB/SUB)"
echo "   • Frontend: localhost:3000 (Web)"
echo ""
echo "📊 Métricas:"
echo "   • Latencia: <5ms (target)"
echo "   • Spread mínimo: 0.5%"
echo "   • Exchanges: Binance + Kraken"
echo ""
echo "📖 Documentación:"
echo "   • README.md - Guía general"
echo "   • ARCHITECTURE.md - Arquitectura técnica"
echo "   • PROJECT_STATUS.md - Estado del proyecto"
echo ""
