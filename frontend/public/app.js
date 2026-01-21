// --- Referencias al DOM ---
const logTable = document.getElementById('log');
const elTotalSignals = document.getElementById('total-signals');
const elAvgSpread = document.getElementById('avg-spread');
const elMaxSpread = document.getElementById('max-spread');
const landingView = document.getElementById('landing-view');
const dashboardView = document.getElementById('dashboard-view');
const enterBtn = document.getElementById('enter-btn');
const backBtn = document.getElementById('back-btn');
const canvas = document.getElementById('matrix-bg');

// Estado de estadísticas
let stats = {
    count: 0,
    totalSpread: 0,
    maxSpread: -Infinity
};

// --- 1. MATRIX RAIN EFFECT (Monedas & Colores) ---
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const symbols = "₿ΞŁÐ¢$€¥01"; // Monedas y binario
const fontSize = 16;
let columns = canvas.width / fontSize;
const drops = [];

// Inicializar gotas
for (let i = 0; i < columns; i++) {
    drops[i] = 1;
}

function drawMatrix() {
    // Fondo semi-transparente para efecto estela
    ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        // Color aleatorio de la paleta: Naranja, Zapote, Amarillo
        const colors = ['#F7931A', '#FF4500', '#FFD700', '#CC5500'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        
        const text = symbols.charAt(Math.floor(Math.random() * symbols.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}
setInterval(drawMatrix, 50);

// --- 2. NAVEGACIÓN ---
enterBtn.addEventListener('click', () => {
    landingView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    dashboardView.style.display = 'block'; // Asegurar display
    connectWebSocket(); // Iniciar conexión solo al entrar
});

backBtn.addEventListener('click', () => {
    dashboardView.classList.add('hidden');
    setTimeout(() => dashboardView.style.display = 'none', 800);
    landingView.classList.remove('hidden');
});

// --- 3. EFECTO 3D TILT (Movimiento de tarjetas) ---
document.addEventListener('mousemove', (e) => {
    if (dashboardView.classList.contains('hidden')) return;

    const cards = document.querySelectorAll('.tilt-card');
    const x = (window.innerWidth / 2 - e.pageX) / 50;
    const y = (window.innerHeight / 2 - e.pageY) / 50;

    cards.forEach(card => {
        card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    });
});

// --- 4. LÓGICA WEBSOCKET (Existente) ---
function connectWebSocket() {
    // Evitar múltiples conexiones
    if (window.wsConnection && window.wsConnection.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket('ws://localhost:8765');
    window.wsConnection = socket;

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
    if (spread >= 0.5) return '<span class="badge badge-high">🚀 SNIPE</span>';
    if (spread > 0) return '<span class="badge badge-med">⚠️ ARBITRAGE</span>';
    return '<span class="badge badge-neg">🧪 SIM</span>';
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
        row.style.backgroundColor = "rgba(247, 147, 26, 0.2)";
        setTimeout(() => row.style.backgroundColor = "transparent", 500);
    }
}