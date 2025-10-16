const express = require('express');
const router = express.Router();

// Minimal test endpoint
router.get('/ping', (req, res) => {
    res.json({ message: 'pong from minimal', timestamp: new Date().toISOString() });
});

module.exports = router;
