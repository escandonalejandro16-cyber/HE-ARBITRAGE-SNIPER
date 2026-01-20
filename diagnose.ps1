#!/usr/bin/env pwsh
# Windows PowerShell Diagnostic Script for Socket.io Connection Issues

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ARBITRAGE SNIPER - WEBSOCKET DIAGNOSTIC TOOL            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$diagnostics = @()

# 1. Check Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
$nodeCheck = node --version 2>$null
if ($nodeCheck) {
    Write-Host "✅ Node.js instalado: $nodeCheck" -ForegroundColor Green
    $diagnostics += "✅ Node.js: OK"
} else {
    Write-Host "❌ Node.js NO encontrado" -ForegroundColor Red
    $diagnostics += "❌ Node.js: NO INSTALADO"
}

# 2. Check npm
Write-Host "🔍 Verificando npm..." -ForegroundColor Yellow
$npmCheck = npm --version 2>$null
if ($npmCheck) {
    Write-Host "✅ npm instalado: $npmCheck" -ForegroundColor Green
    $diagnostics += "✅ npm: OK"
} else {
    Write-Host "❌ npm NO encontrado" -ForegroundColor Red
    $diagnostics += "❌ npm: NO INSTALADO"
}

# 3. Check if port 3000 is in use
Write-Host "🔍 Verificando puerto 3000..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "⚠️  Puerto 3000 EN USO (proceso corriendo)" -ForegroundColor Yellow
    $diagnostics += "⚠️  Puerto 3000: EN USO"
    Write-Host "    Proceso: $($portCheck.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "✅ Puerto 3000 disponible" -ForegroundColor Green
    $diagnostics += "✅ Puerto 3000: DISPONIBLE"
}

# 4. Check if server.js exists
Write-Host "🔍 Verificando archivos..." -ForegroundColor Yellow
$serverExists = Test-Path "server.js"
if ($serverExists) {
    Write-Host "✅ server.js encontrado" -ForegroundColor Green
    $diagnostics += "✅ server.js: EXISTE"
} else {
    Write-Host "❌ server.js NO encontrado" -ForegroundColor Red
    $diagnostics += "❌ server.js: NO EXISTE"
}

$mainExists = Test-Path "js/main.js"
if ($mainExists) {
    Write-Host "✅ js/main.js encontrado" -ForegroundColor Green
    $diagnostics += "✅ js/main.js: EXISTE"
} else {
    Write-Host "❌ js/main.js NO encontrado" -ForegroundColor Red
    $diagnostics += "❌ js/main.js: NO EXISTE"
}

# 5. Check node_modules
Write-Host "🔍 Verificando node_modules..." -ForegroundColor Yellow
$modulesExist = Test-Path "node_modules"
if ($modulesExist) {
    Write-Host "✅ node_modules encontrado" -ForegroundColor Green
    $diagnostics += "✅ node_modules: EXISTE"
    
    # Check key packages
    $sockioExists = Test-Path "node_modules/socket.io"
    if ($sockioExists) {
        Write-Host "  ✅ socket.io instalado" -ForegroundColor Green
        $diagnostics += "  ✅ socket.io: OK"
    } else {
        Write-Host "  ❌ socket.io NO encontrado" -ForegroundColor Red
        $diagnostics += "  ❌ socket.io: FALTA"
    }
} else {
    Write-Host "❌ node_modules NO encontrado" -ForegroundColor Red
    Write-Host "    → Ejecutar: npm install" -ForegroundColor Yellow
    $diagnostics += "❌ node_modules: NO EXISTE"
}

# 6. Test HTTP endpoint
Write-Host "🔍 Intentando conectar a http://localhost:3000/health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor responde en puerto 3000" -ForegroundColor Green
        Write-Host "   Respuesta: $($response.Content)" -ForegroundColor Gray
        $diagnostics += "✅ Servidor HTTP: RESPONDE"
    }
} catch {
    Write-Host "❌ Servidor NO responde en puerto 3000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    $diagnostics += "❌ Servidor HTTP: NO RESPONDE"
}

# 7. Check socket.io version in package.json
Write-Host "🔍 Verificando versión de socket.io..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
    if ($packageJson.dependencies.'socket.io') {
        Write-Host "✅ socket.io versión: $($packageJson.dependencies.'socket.io')" -ForegroundColor Green
        $diagnostics += "✅ socket.io version: $($packageJson.dependencies.'socket.io')"
    } else {
        Write-Host "❌ socket.io NO en package.json" -ForegroundColor Red
        $diagnostics += "❌ socket.io: NO EN PACKAGE.JSON"
    }
}

# 8. Check for common issues in server.js
Write-Host "🔍 Analizando server.js..." -ForegroundColor Yellow
$serverContent = Get-Content server.js -Raw -ErrorAction SilentlyContinue
if ($serverContent) {
    if ($serverContent -match 'new Server\(httpServer') {
        Write-Host "✅ Socket.io Server inicializado correctamente" -ForegroundColor Green
        $diagnostics += "✅ server.js: Server config OK"
    } else {
        Write-Host "⚠️  Socket.io Server initialización no encontrada" -ForegroundColor Yellow
        $diagnostics += "⚠️  server.js: Server config INCOMPLETA"
    }
    
    if ($serverContent -match "httpServer.listen\(") {
        Write-Host "✅ httpServer.listen() encontrado" -ForegroundColor Green
        $diagnostics += "✅ server.js: listen() OK"
    } else {
        Write-Host "❌ httpServer.listen() NO encontrado" -ForegroundColor Red
        $diagnostics += "❌ server.js: listen() FALTA"
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    REPORTE FINAL                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

foreach ($diag in $diagnostics) {
    Write-Host $diag
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Determinar próximos pasos
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""

$hasErrors = $diagnostics | Where-Object { $_ -match "^❌" }

if ($hasErrors) {
    Write-Host "1️⃣  INSTALAR DEPENDENCIAS:"
    Write-Host "    npm install" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "2️⃣  INICIAR SERVIDOR:"
    Write-Host "    npm start" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "3️⃣  ABRIR EN NAVEGADOR:"
    Write-Host "    http://localhost:3000" -ForegroundColor Magenta
} else {
    Write-Host "✅ Sistema listo. Ejecuta:" -ForegroundColor Green
    Write-Host "    npm start" -ForegroundColor Magenta
}

Write-Host ""
Write-Host "🔍 PARA DEBUGGING:"
Write-Host "    1. Abre DevTools: F12" -ForegroundColor Gray
    Write-Host "    2. Console → Busca errores rojos" -ForegroundColor Gray
    Write-Host "    3. Ver: WEBSOCKET_TROUBLESHOOTING.md" -ForegroundColor Gray

Write-Host ""
