// Database factory to switch between different databases based on environment
const logger = require('./logger');

const useSupabase = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

// Use Supabase PostgreSQL if DATABASE_URL is set
if (useSupabase) {
    logger.info('Using Supabase PostgreSQL database');
    const db = require('./database-postgres');

    // Initialize database asynchronously without blocking module load
    // Don't wait for initialization to complete
    setImmediate(() => {
        db.initialize().catch(err => {
            logger.error('Database initialization failed (non-blocking)', { error: err.message });
        });
    });

    module.exports = db;
} else {
    // Fallback to simple in-memory database
    logger.info('Using simple in-memory database (fallback)');
    const db = require('./database-simple');

    setImmediate(() => {
        db.initialize().catch(err => {
            logger.error('Database initialization failed (non-blocking)', { error: err.message });
        });
    });

    module.exports = db;
}