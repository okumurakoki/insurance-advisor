// Minimal version for debugging
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all requests
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle OPTIONS
app.options('*', cors());

app.use(express.json());

// Test endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.all('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        message: 'Main app is temporarily disabled for debugging'
    });
});

module.exports = app;
