try {
    const app = require('../src/app');

    // Export app directly for Vercel
    module.exports = app;
} catch (error) {
    console.error('Failed to load app:', error);
    // Export a minimal error handler
    const express = require('express');
    const errorApp = express();
    errorApp.all('*', (req, res) => {
        res.status(500).json({
            error: 'Application failed to initialize',
            details: error.message
        });
    });
    module.exports = errorApp;
}