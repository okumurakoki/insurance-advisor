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

const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
// CORS configuration with better error handling
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['*'];
console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // Temporarily allow all origins to debug
        return callback(null, true);
        
        // Check if origin is in allowed list or if wildcard is set
        // if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        //     return callback(null, true);
        // } else {
        //     console.error(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
        //     return callback(new Error('Not allowed by CORS'), false);
        // }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const analysisRoutes = require('./routes/analysis');
const lineRoutes = require('./routes/line');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/line', lineRoutes);

// Add basic root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Variable Insurance Advisory System API',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    // Handle CORS errors specifically
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS policy violation',
            message: err.message
        });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        details: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
}

module.exports = app;