#!/bin/bash
# 🔍 VALIDATION CHECK - Verificar que todo está listo

echo "╔═════════════════════════════════════════════════════════════╗"
echo "║         ARBITRAGE SNIPER - SISTEMA DE VALIDACIÓN           ║"
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0

# Función para chequear comando
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 instalado"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $1 NO instalado"
        FAILED=$((FAILED + 1))
    fi
}

# Función para chequear puerto
check_port() {
    if nc -z localhost $1 2>/dev/null; then
        echo "✅ Puerto $1: EN USO"
        PASSED=$((PASSED + 1))
    else
        echo "⚠️  Puerto $1: DISPONIBLE (servicio no iniciado)"
    fi
}

# Función para chequear archivo
check_file() {
    if [ -f "$1" ]; then
        echo "✅ Archivo: $1"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FALTA: $1"
        FAILED=$((FAILED + 1))
    fi
}

# Función para chequear carpeta
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ Carpeta: $1"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FALTA CARPETA: $1"
        FAILED=$((FAILED + 1))
    fi
}

echo "📋 REQUISITOS DEL SISTEMA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_command node
check_command npm
check_command python
check_command pip
check_command docker
check_command docker-compose

echo ""
echo "📁 ESTRUCTURA DE CARPETAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dir "ingestor"
check_dir "quant-engine"
check_dir "frontend"

echo ""
echo "📄 ARCHIVOS CRÍTICOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "docker-compose.yml"
check_file "requirements.txt"
check_file "ingestor/package.json"
check_file "ingestor/src/index.js"
check_file "quant-engine/src/main.py"
check_file "frontend/package.json"
check_file "frontend/index.html"
check_file "frontend/server.js"

echo ""
echo "🔌 PUERTOS Y SERVICIOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🔹 Redis:           6379"
check_port 6379

echo "🔹 Frontend:        3000"
check_port 3000

echo "🔹 ZMQ (interno):   5555"
check_port 5555

echo ""
echo "📦 VERSIONES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Node.js:   $(node --version 2>/dev/null || echo 'NO INSTALADO')"
echo "npm:       $(npm --version 2>/dev/null || echo 'NO INSTALADO')"
echo "Python:    $(python --version 2>/dev/null || echo 'NO INSTALADO')"
echo "Docker:    $(docker --version 2>/dev/null || echo 'NO INSTALADO')"

echo ""
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✅ Pasadas: $PASSED"
echo "❌ Fallos:   $FAILED"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "╔═════════════════════════════════════════════════════════════╗"
    echo "║  ✨ TODO ESTÁ LISTO - ¡Puedes iniciar los servicios! ✨   ║"
    echo "╚═════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecuta: docker-compose up --build"
    echo "2. Accede:  http://localhost:3000"
    echo ""
else
    echo ""
    echo "╔═════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️  ALGUNOS REQUISITOS NO ESTÁN INSTALADOS              ║"
    echo "╚═════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Instala lo que falta y vuelve a ejecutar este script."
    echo ""
fi
