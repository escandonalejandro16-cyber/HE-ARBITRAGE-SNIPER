import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import redis from 'redis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        allowEIO3: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
    connectTimeout: 45000,
    allowUpgrades: true
});

// Redis client
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', err => console.log('❌ Redis Error:', err));
redisClient.on('connect', () => console.log('✅ Conectado a Redis'));

await redisClient.connect().catch(err => {
    console.log('⚠️ No se pudo conectar a Redis, modo demo activado');
});

// Middleware
app.use(cors());
app.use(express.static(__dirname));

// Debug logging
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    console.log('📊 Total clientes conectados:', io.engine.clientsCount);

    socket.emit('connected', {
        message: 'Conectado al dashboard',
        timestamp: new Date()
    });

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
        console.log('📊 Total clientes conectados:', io.engine.clientsCount);
    });
});

// Redis subscriber para signals
let redisConnected = false;

(async () => {
    try {
        const subscriber = redisClient.duplicate();
        await subscriber.connect();

        await subscriber.subscribe('signals', (message) => {
            console.log('📊 Signal recibida desde Redis:', message);
            try {
                const signal = JSON.parse(message);
                io.emit('signal', signal);
            } catch (err) {
                console.error('Error parseando signal:', err);
            }
        });

        redisConnected = true;
        console.log('📢 Suscrito a canal Redis: signals');
    } catch (err) {
        console.warn('⚠️ No se pudo conectar a Redis. Modo demo activado.');
        console.warn('   Emitiendo datos simulados del backend...');
        redisConnected = false;
    }
})();

// Simulador de eventos del backend (para testing sin backend real)
if (true) {  // Siempre activar simulador como fallback
    let basePrice = { binance: 42000, kraken: 42210 };
    let latencyP50 = 1.1;
    let latencyP99 = 3.1;
    
    // Broadcast de precios actualizados cada 500ms
    setInterval(() => {
        if (io.engine.clientsCount > 0) {
            // Movimiento pequeño de precios (±0.3%)
            const change = (Math.random() - 0.5) * 300;
            basePrice.binance += change;
            basePrice.kraken += change * 1.0048;  // Mantener spread
            
            io.emit('price_update', {
                binance: Math.round(basePrice.binance * 100) / 100,
                kraken: Math.round(basePrice.kraken * 100) / 100,
                timestamp: Date.now()
            });
        }
    }, 500);
    
    // Actualización de latencia cada segundo
    setInterval(() => {
        if (io.engine.clientsCount > 0) {
            latencyP50 += (Math.random() - 0.5) * 0.3;
            latencyP99 += (Math.random() - 0.5) * 0.5;
            
            // Mantener en rango realista
            latencyP50 = Math.max(0.5, Math.min(3, latencyP50));
            latencyP99 = Math.max(1.5, Math.min(5, latencyP99));
            
            io.emit('latency_update', {
                p50: Math.round(latencyP50 * 100) / 100,
                p99: Math.round(latencyP99 * 100) / 100,
                timestamp: Date.now()
            });
        }
    }, 1000);
    
    // Generación de spreads cada 100ms
    setInterval(() => {
        if (io.engine.clientsCount > 0 && Math.random() < 0.3) {
            const spread = ((basePrice.kraken - basePrice.binance) / basePrice.binance) * 100;
            
            io.emit('spread_update', {
                spread: Math.round(spread * 100) / 100,
                timestamp: Date.now()
            });
            
            // Si spread >= 0.5%, generar signal
            if (spread >= 0.5) {
                const signal = {
                    buy: 'BINANCE',
                    sell: 'KRAKEN',
                    spread: Math.round(spread * 100) / 100,
                    _latency_us: Math.round(latencyP50 * 1000),
                    timestamp: Date.now()
                };
                
                console.log('🎯 Signal simulada generada:', signal);
                io.emit('signal', signal);
            }
        }
    }, 100);
    
    console.log('🤖 Simulador de backend activado (fallback)');
}

// Server start
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Dashboard servidor corriendo en http://localhost:${PORT}`);
});
