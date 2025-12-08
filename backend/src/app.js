const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load local environment first, then fallback to regular .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for CORS preflight
});

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
// CORS configuration with proper security
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [
    'https://app.insurance-optimizer.com',
    'https://insurance-optimizer.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) return callback(null, true);

        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // In production, check whitelist
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            const logger = require('./utils/logger');
            logger.warn(`CORS blocked origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle OPTIONS requests early, before any other middleware
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const analysisRoutes = require('./routes/analysis');
const lineRoutes = require('./routes/line');
const cronRoutes = require('./routes/cron');
const adminRoutes = require('./routes/admin');
const insuranceRoutes = require('./routes/insurance');
const pdfUploadRoutes = require('./routes/pdf-upload');
const migrationsRoutes = require('./routes/migrations');
const stripeRoutes = require('./routes/stripe');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/pdf-upload', pdfUploadRoutes);
app.use('/api/migrations', migrationsRoutes);
app.use('/api/stripe', stripeRoutes);

// Add basic root route
app.get('/', (req, res) => {
    res.json({
        message: 'Variable Insurance Advisory System API',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.3.2',
        deployment: 'auto',
        testMarker: 'PRODUCTION_2025_11_03_AUTO_DEPLOY_TEST'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        memory: process.env.USE_MEMORY_DB
    });
});

// Add /api/health as well
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Insurance Advisor API is running'
    });
});

// Simple test endpoint
app.get('/api/test-simple', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Simple test endpoint working',
        env: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const db = require('./utils/database-factory');
        const users = await db.query('SELECT user_id, account_type FROM users LIMIT 5');
        res.json({
            status: 'OK',
            message: 'Database connected',
            usersCount: users.length,
            users: users
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

// Add favicon handler to prevent 404s
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Global error handler
const logger = require('./utils/logger');
app.use((err, req, res, next) => {
    logger.error('Global error handler:', { error: err.message, stack: err.stack });

    // Handle CORS errors specifically
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'このリクエストは許可されていません。'
        });
    }

    // User-friendly error messages for production
    const userMessage = process.env.NODE_ENV === 'production'
        ? 'サーバーエラーが発生しました。しばらくしてから再度お試しください。'
        : err.message;

    res.status(err.status || 500).json({
        error: userMessage,
        // Never expose stack traces in production
        ...(process.env.NODE_ENV !== 'production' && { details: err.stack })
    });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
}

module.exports = app;