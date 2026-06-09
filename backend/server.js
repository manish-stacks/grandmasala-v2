const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

dotenv.config();

const ConnectDB = require('./database/database.config');
const route = require('./routes/routes');
const setupBullBoard = require('./bullboard');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 7500;

// ─────────────────────────────────────────────
// CORS Config
// ─────────────────────────────────────────────
const allowedOrigins = [
    "https://grandmasala.in",
    "https://www.grandmasala.in",
    "http://localhost:5173",
    "http://localhost:3014",
    "https://admin.grandmasala.in",
    "https://www.admin.grandmasala.in",
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// ─────────────────────────────────────────────
// Core Middleware
// ─────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Grand Masala API is running 🌶',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

// Test mail route (dev only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/test-mail', async (req, res) => {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: { user: process.env.SMTP_MAIL, pass: process.env.SMTP_PASS }
            });
            await transporter.sendMail({
                from: process.env.SMTP_MAIL,
                to: 'codersvox@gmail.com',
                subject: 'Test Email',
                html: '<h1>Mail Test Working ✅</h1>'
            });
            res.json({ success: true, message: 'Email sent!' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
}

// ─────────────────────────────────────────────
// SEO Routes (before /api/v1)
// ─────────────────────────────────────────────
const { getSitemap, getRobotsTxt } = require('./controller/sitemap.controller');
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobotsTxt);

// ─────────────────────────────────────────────
// Bull Board (queue monitoring)
// ─────────────────────────────────────────────
setupBullBoard(app);

// ─────────────────────────────────────────────
// Database Connect
// ─────────────────────────────────────────────
ConnectDB();

// ─────────────────────────────────────────────
// Redis Setup
// ─────────────────────────────────────────────
const redis = require('redis');
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

const connectRedis = async () => {
    try {
        redisClient.on('error', (err) => {
            console.error(`Redis Error: ${err.message}`);
        });
        redisClient.on('ready', () => console.log('✅ Redis connected'));
        await redisClient.connect();
        await redisClient.ping();
        app.locals.redis = redisClient;
    } catch (error) {
        console.error(`Redis connection failed: ${error.message}`);
        // Don't exit — Redis is optional for basic functionality
    }
};

(async () => {
    await connectRedis();
})();

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/v1', route);

// ─────────────────────────────────────────────
// Error Handling (must be last)
// ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(port, () => {
    console.log(`\n🌶  Grand Masala Backend v2.0`);
    console.log(`🚀  Server: http://localhost:${port}`);
    console.log(`📊  Bull Board: http://localhost:${port}/admin/queues`);
    console.log(`🗺   Sitemap: http://localhost:${port}/sitemap.xml`);
    console.log(`🤖  Robots: http://localhost:${port}/robots.txt\n`);
});

module.exports = app;
