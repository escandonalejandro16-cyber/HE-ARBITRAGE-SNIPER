// Referencias al DOM
const logTable = document.getElementById('log');
const elTotalSignals = document.getElementById('total-signals');
const elAvgSpread = document.getElementById('avg-spread');
const elMaxSpread = document.getElementById('max-spread');

// Estado de estadísticas
let stats = {
    count: 0,
    totalSpread: 0,
    maxSpread: -Infinity
};

function connectWebSocket() {
    const socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
        console.log("✅ Conectado al WebSocket Bridge");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateStats(data);
        addTableRow(data);
    };

    socket.onclose = () => {
        console.warn("⚠️ Conexión perdida. Reintentando en 3 segundos...");
        setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = (err) => {
        console.error("❌ Error en WebSocket:", err);
        socket.close();
    };
}

// Iniciar conexión
connectWebSocket();

function updateStats(data) {
    const spread = parseFloat(data.spread);
    
    stats.count++;
    stats.totalSpread += spread;
    
    if (spread > stats.maxSpread) {
        stats.maxSpread = spread;
    }

    // Renderizar en DOM
    elTotalSignals.textContent = stats.count;
    elAvgSpread.textContent = (stats.totalSpread / stats.count).toFixed(4) + '%';
    elMaxSpread.textContent = stats.maxSpread.toFixed(4) + '%';
}

function getQualityBadge(spread) {
    if (spread >= 0.5) return '<span class="badge badge-high">ALTA 🚀</span>';
    if (spread > 0) return '<span class="badge badge-med">MEDIA ⚠️</span>';
    return '<span class="badge badge-neg">SIMULADA 🧪</span>';
}

function addTableRow(data) {
    const row = logTable.insertRow(0);
    
    // Limitar a las últimas 15 filas para no saturar la memoria del navegador
    if (logTable.rows.length > 15) logTable.deleteRow(15);

    row.innerHTML = `
        <td>${new Date().toLocaleTimeString()}</td>
        <td class="buy">${data.buy}</td>
        <td class="sell">${data.sell}</td>
        <td class="spread">${data.spread}%</td>
        <td>${getQualityBadge(data.spread)}</td>
    `;
    
    // Efecto visual flash si es una buena oportunidad
    if (data.spread > 0) {
        row.style.backgroundColor = "rgba(46, 160, 67, 0.1)";
        setTimeout(() => row.style.backgroundColor = "transparent", 500);
    }
}