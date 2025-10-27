const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.method === 'OPTIONS'
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Early OPTIONS handler
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use('/api/', limiter);

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Variable Insurance Advisory System API',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.3.0',
        deployment: 'auto'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Insurance Advisor API is running'
    });
});

// Load routes
console.log('Loading routes...');

try {
    const authRoutes = require('../src/routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
}

try {
    const userRoutes = require('../src/routes/users');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded');
} catch (error) {
    console.error('❌ Failed to load user routes:', error.message);
}

try {
    const customerRoutes = require('../src/routes/customers');
    app.use('/api/customers', customerRoutes);
    console.log('✅ Customer routes loaded');
} catch (error) {
    console.error('❌ Failed to load customer routes:', error.message);
}

try {
    const analysisRoutes = require('../src/routes/analysis');
    app.use('/api/analysis', analysisRoutes);
    console.log('✅ Analysis routes loaded');
} catch (error) {
    console.error('❌ Failed to load analysis routes:', error.message);
}

try {
    const lineRoutes = require('../src/routes/line');
    app.use('/api/line', lineRoutes);
    console.log('✅ LINE routes loaded');
} catch (error) {
    console.error('❌ Failed to load LINE routes:', error.message);
}

try {
    const cronRoutes = require('../src/routes/cron');
    app.use('/api/cron', cronRoutes);
    console.log('✅ Cron routes loaded');
} catch (error) {
    console.error('❌ Failed to load cron routes:', error.message);
}

try {
    const adminRoutes = require('../src/routes/admin');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded');
} catch (error) {
    console.error('❌ Failed to load admin routes:', error.message);
}

try {
    const insuranceRoutes = require('../src/routes/insurance');
    app.use('/api/insurance', insuranceRoutes);
    console.log('✅ Insurance routes loaded');
} catch (error) {
    console.error('❌ Failed to load insurance routes:', error.message);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

console.log('✅ Application initialized');

module.exports = app;
