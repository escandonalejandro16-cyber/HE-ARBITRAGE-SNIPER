// ============================================
// THE ARBITRAGE SNIPER - DASHBOARD JS
// ============================================

// CONFIG
const CONFIG = {
    updateInterval: 1000,
    maxHistoryPoints: 60,
    mockMode: false  // ✅ CONECTADO A BACKEND REAL
};

// STATE
let state = {
    signals: [],
    spreads: [],
    latencies: [],
    prices: {
        binance: 42150.50,
        kraken: 42372.25
    },
    startTime: Date.now(),
    signalsCount: 0
};

// CHARTS
let charts = {};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initUI();
    
    if (CONFIG.mockMode) {
        console.log('⚠️  MODO DEMO ACTIVADO (datos fake)');
        startMockData();
    } else {
        console.log('🔌 MODO PRODUCCIÓN - Conectando al backend...');
        connectSocket();
    }
    
    updateSessionTime();
    setInterval(updateSessionTime, 1000);
});

// ============================================
// CHARTS SETUP
// ============================================

function initCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#eaeaea',
                    font: { size: 12 }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#666' },
                grid: { color: 'rgba(0, 212, 255, 0.05)' }
            },
            y: {
                ticks: { color: '#666' },
                grid: { color: 'rgba(0, 212, 255, 0.05)' }
            }
        }
    };

    // CHART 1: Spreads
    const spreadCtx = document.getElementById('spreadChart').getContext('2d');
    charts.spread = new Chart(spreadCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Spread (%)',
                data: [],
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#0099cc'
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    min: 0,
                    max: 1.5
                }
            }
        }
    });

    // CHART 2: Latencia
    const latencyCtx = document.getElementById('latencyChart').getContext('2d');
    charts.latency = new Chart(latencyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'P50 (ms)',
                    data: [],
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 2
                },
                {
                    label: 'P99 (ms)',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 2
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: {
                    ...chartDefaults.scales.y,
                    min: 0,
                    max: 5
                }
            }
        }
    });

    // CHART 3: Distribución de Spreads
    const distCtx = document.getElementById('distributionChart').getContext('2d');
    charts.distribution = new Chart(distCtx, {
        type: 'bar',
        data: {
            labels: ['<0.5%', '0.5-0.7%', '0.7-1.0%', '1.0-1.5%', '>1.5%'],
            datasets: [{
                label: 'Frecuencia',
                data: [15, 42, 28, 12, 3],
                backgroundColor: [
                    'rgba(100, 100, 100, 0.6)',
                    'rgba(0, 212, 255, 0.6)',
                    'rgba(0, 212, 255, 0.8)',
                    'rgba(255, 107, 107, 0.6)',
                    'rgba(255, 107, 107, 0.8)'
                ],
                borderColor: '#00d4ff',
                borderWidth: 1
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y'
        }
    });
}

// ============================================
// UI UPDATE
// ============================================

function initUI() {
    updateStatus('CONECTADO', true);
    updateKPIs();
}

function updateStatus(text, isOnline) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const dot = indicator.querySelector('.dot');
    
    statusText.textContent = text;
    if (isOnline) {
        dot.style.background = '#51cf66';
    } else {
        dot.style.background = '#ff6b6b';
    }
}

function updateKPIs() {
    // Latencia
    const latencyValue = (Math.random() * 1.5 + 1).toFixed(1);
    document.getElementById('latencyValue').textContent = latencyValue;

    // Signals
    document.getElementById('signalsCount').textContent = Math.floor(Math.random() * 10) + 8;
    document.getElementById('todaySignals').textContent = state.signalsCount;

    // Spread
    const spread = (Math.random() * 0.75 + 0.4).toFixed(2);
    document.getElementById('spreadValue').textContent = spread;

    // Ticks/s
    const ticksPerSec = Math.floor(Math.random() * 10) + 15;
    document.getElementById('ticksPerSec').textContent = ticksPerSec;
}

function updateSessionTime() {
    const elapsed = Date.now() - state.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('sessionTime').textContent = time;
    document.getElementById('totalSignals').textContent = state.signalsCount;
}

// ============================================
// MOCK DATA GENERATOR
// ============================================

function startMockData() {
    updateStatus('ONLINE (Mock)', true);
    
    // Generar datos iniciales
    for (let i = 60; i > 0; i--) {
        const time = new Date(Date.now() - i * 1000);
        const timeStr = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
        
        state.spreads.push({
            time: timeStr,
            value: Math.random() * 0.8 + 0.3
        });

        state.latencies.push({
            time: timeStr,
            p50: Math.random() * 1.5 + 1,
            p99: Math.random() * 2 + 2.5
        });
    }

    // Actualizar charts
    updateChartsData();

    // Actualizar precios
    updatePrices();

    // Generar nuevos datos cada segundo
    setInterval(() => {
        generateMockSignal();
        updateChartsData();
        updatePrices();
        updateKPIs();
    }, CONFIG.updateInterval);
}

function generateMockSignal() {
    const rand = Math.random();
    
    if (rand > 0.85) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const signal = {
            time: timeStr,
            action: 'COMPRA/VENTA',
            spread: (Math.random() * 0.75 + 0.5).toFixed(2),
            buy: 'BINANCE',
            sell: 'KRAKEN',
            latency: (Math.random() * 2 + 1).toFixed(1)
        };

        state.signals.unshift(signal);
        state.signalsCount++;

        if (state.signals.length > 5) {
            state.signals.pop();
        }

        addSignalRow(signal);
    }

    // Agregar datos a spreads y latencies
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    state.spreads.push({
        time: timeStr,
        value: Math.random() * 0.8 + 0.3
    });

    state.latencies.push({
        time: timeStr,
        p50: Math.random() * 1.5 + 1,
        p99: Math.random() * 2 + 2.5
    });

    if (state.spreads.length > CONFIG.maxHistoryPoints) {
        state.spreads.shift();
    }
    if (state.latencies.length > CONFIG.maxHistoryPoints) {
        state.latencies.shift();
    }
}

function updateChartsData() {
    // Spread Chart
    charts.spread.data.labels = state.spreads.map(s => s.time);
    charts.spread.data.datasets[0].data = state.spreads.map(s => s.value);
    charts.spread.update('none');

    // Latency Chart
    charts.latency.data.labels = state.latencies.map(l => l.time);
    charts.latency.data.datasets[0].data = state.latencies.map(l => l.p50);
    charts.latency.data.datasets[1].data = state.latencies.map(l => l.p99);
    charts.latency.update('none');
}

function updatePrices() {
    // Simular movimiento de precios
    state.prices.binance += (Math.random() - 0.5) * 10;
    state.prices.kraken += (Math.random() - 0.5) * 10;

    document.getElementById('binancePrice').textContent = `$${state.prices.binance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    document.getElementById('krakenPrice').textContent = `$${state.prices.kraken.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

    const now = new Date();
    const timeStr = `hace ${Math.floor(Math.random() * 2) + 0.1}s`;
    document.getElementById('binanceTime').textContent = timeStr;
    document.getElementById('krakenTime').textContent = timeStr;
}

function addSignalRow(signal) {
    const tbody = document.getElementById('signalsTableBody');
    const newRow = document.createElement('tr');
    newRow.className = 'signal-row';
    
    const spreadClass = parseFloat(signal.spread) >= 0.5 ? 'positive' : 'neutral';
    
    newRow.innerHTML = `
        <td>${signal.time}</td>
        <td><span class="signal-badge buy">${signal.action}</span></td>
        <td><span class="spread ${spreadClass}">+${signal.spread}%</span></td>
        <td>${signal.buy}</td>
        <td>${signal.sell}</td>
        <td>${signal.latency}ms</td>
    `;
    
    tbody.insertBefore(newRow, tbody.firstChild);
    
    // Mantener solo últimas 10 señales
    while (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastChild);
    }
}

// ============================================
// SOCKET.IO CONNECTION (Cuando sea necesario)
// ============================================

function connectSocket() {
    console.log('🔌 Conectando a backend real (Socket.io)...');
    
    const socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        forceNew: false,
        path: '/socket.io/'
    });

    socket.on('connect', () => {
        console.log('✅ CONECTADO al backend');
        updateStatus('CONECTADO AL BACKEND', true);
        
        // Inicializar datos históricos
        for (let i = 60; i > 0; i--) {
            const time = new Date(Date.now() - i * 1000);
            const timeStr = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
            
            state.spreads.push({
                time: timeStr,
                value: Math.random() * 0.8 + 0.3
            });

            state.latencies.push({
                time: timeStr,
                p50: Math.random() * 1.5 + 1,
                p99: Math.random() * 2 + 2.5
            });
        }
        updateChartsData();
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Desconectado del backend. Razón:', reason);
        updateStatus('DESCONECTADO', false);
    });

    socket.on('error', (error) => {
        console.error('🚨 Socket.io ERROR:', error);
        updateStatus('ERROR DE CONEXIÓN', false);
    });

    socket.on('connect_error', (error) => {
        console.error('🚨 Connection Error:', error.message);
        updateStatus('ERROR DE CONEXIÓN', false);
    });

    socket.on('reconnect_attempt', () => {
        console.log('🔄 Intentando reconectar...');
        updateStatus('RECONECTANDO...', false);
    });

    // 📊 Signal recibida del Quant Engine (via Redis)
    socket.on('signal', (data) => {
        console.log('🎯 SIGNAL RECIBIDA del backend:', data);
        
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const signal = {
            time: timeStr,
            action: data.buy && data.sell ? 'COMPRA/VENTA' : 'WAIT',
            spread: data.spread ? data.spread.toFixed(2) : '0.00',
            buy: data.buy || '—',
            sell: data.sell || '—',
            latency: data._latency_us ? (data._latency_us / 1000).toFixed(1) : '0.0'
        };

        addSignalRow(signal);
        state.signalsCount++;
        document.getElementById('totalSignals').textContent = state.signalsCount;
    });

    // 💹 Actualización de precios (desde Python via Redis)
    socket.on('price_update', (data) => {
        console.log('💹 Precio actualizado:', data);
        state.prices.binance = data.binance;
        state.prices.kraken = data.kraken;
        updatePrices();
    });

    // ⏱️ Actualización de latencia
    socket.on('latency_update', (data) => {
        console.log('⏱️ Latencia actualizada:', data);
        
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        state.latencies.push({
            time: timeStr,
            p50: data.p50,
            p99: data.p99
        });

        if (state.latencies.length > CONFIG.maxHistoryPoints) {
            state.latencies.shift();
        }

        updateChartsData();
    });

    // 📈 Spread actualizado
    socket.on('spread_update', (data) => {
        console.log('📈 Spread actualizado:', data);
        
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        state.spreads.push({
            time: timeStr,
            value: data.spread
        });

        if (state.spreads.length > CONFIG.maxHistoryPoints) {
            state.spreads.shift();
        }

        updateChartsData();
    });

    // 🔥 Tick recibido
    socket.on('tick', (data) => {
        console.log('📨 Tick recibido:', data);
        
        if (data.exchange === 'BINANCE') {
            state.prices.binance = data.price;
            document.getElementById('binancePrice').textContent = `$${data.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
            document.getElementById('binanceTime').textContent = 'ahora mismo';
        } else if (data.exchange === 'KRAKEN') {
            state.prices.kraken = data.price;
            document.getElementById('krakenPrice').textContent = `$${data.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
            document.getElementById('krakenTime').textContent = 'ahora mismo';
        }
    });

    // Simular algunos eventos del backend para testing
    setTimeout(() => {
        console.log('📤 Simulando datos del backend...');
        
        setInterval(() => {
            // Simular movimiento de precios
            state.prices.binance += (Math.random() - 0.5) * 5;
            state.prices.kraken += (Math.random() - 0.5) * 5;
            
            socket.emit('mock_price_update', {
                binance: state.prices.binance,
                kraken: state.prices.kraken
            });

            // Simular latencia ocasional
            if (Math.random() > 0.8) {
                socket.emit('mock_latency_update', {
                    p50: Math.random() * 1.5 + 1,
                    p99: Math.random() * 2 + 2.5
                });
            }

            // Simular spread ocasional
            if (Math.random() > 0.9) {
                socket.emit('mock_spread_update', {
                    spread: Math.random() * 0.8 + 0.3
                });
            }

            // Simular signal ocasional
            if (Math.random() > 0.95) {
                const spread = Math.random() * 0.75 + 0.5;
                if (spread >= 0.5) {
                    socket.emit('mock_signal', {
                        buy: 'BINANCE',
                        sell: 'KRAKEN',
                        spread: spread,
                        _latency_us: Math.random() * 2000 + 1000
                    });
                }
            }
        }, CONFIG.updateInterval);
    }, 2000);
}

// ============================================
// CHART CONTROLS
// ============================================

document.querySelectorAll('.chart-controls .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-controls .btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        console.log('Rango seleccionado:', e.target.dataset.range);
    });
});

console.log('⚡ Dashboard iniciado');
console.log(`📊 Modo: ${CONFIG.mockMode ? 'DEMO (Mock Data)' : 'PRODUCCIÓN (Backend Real)'}`);
console.log('🔄 Esperando conexión con backend...');
