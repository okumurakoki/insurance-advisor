// Database migration endpoints (admin only)
const express = require('express');
const router = express.Router();
const db = require('../utils/database-factory');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Inline admin check to avoid import issues
const requireAdmin = (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.accountType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// GET /api/migrations - List available migrations
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

        res.json({
            success: true,
            migrations: files
        });
    } catch (error) {
        console.error('Error listing migrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list migrations',
            error: error.message
        });
    }
});

// POST /api/migrations/run - Run a specific migration
router.post('/run', authenticateToken, requireAdmin, async (req, res) => {
    const { migrationFile } = req.body;

    if (!migrationFile) {
        return res.status(400).json({
            success: false,
            message: 'Migration file name is required'
        });
    }

    try {
        const migrationPath = path.join(__dirname, '../../migrations', migrationFile);

        if (!fs.existsSync(migrationPath)) {
            return res.status(404).json({
                success: false,
                message: 'Migration file not found'
            });
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log(`Running migration: ${migrationFile}`);

        // Run the migration
        await db.query(migrationSQL);

        // Verify the changes for Stripe fields
        if (migrationFile.includes('stripe')) {
            const result = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'users'
                AND column_name IN ('payment_method', 'stripe_customer_id', 'stripe_subscription_id')
                ORDER BY column_name;
            `);

            res.json({
                success: true,
                message: `Migration ${migrationFile} completed successfully`,
                newColumns: result
            });
        } else {
            res.json({
                success: true,
                message: `Migration ${migrationFile} completed successfully`
            });
        }

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

module.exports = router;
