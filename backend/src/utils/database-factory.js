// Database factory to switch between different databases based on environment

const useSupabase = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

console.log('Database configuration:', {
    USE_MEMORY_DB: process.env.USE_MEMORY_DB,
    DATABASE_URL: useSupabase ? 'configured' : 'not set',
    NODE_ENV: process.env.NODE_ENV || 'production'
});

// Use Supabase PostgreSQL if DATABASE_URL is set
if (useSupabase) {
    console.log('Using Supabase PostgreSQL database');
    const db = require('./database-postgres');

    // Initialize database asynchronously without blocking module load
    // Don't wait for initialization to complete
    setImmediate(() => {
        db.initialize().catch(err => {
            console.error('Database initialization failed (non-blocking):', err.message);
        });
    });

    module.exports = db;
} else {
    // Fallback to simple in-memory database
    console.log('Using simple in-memory database (fallback)');
    const db = require('./database-simple');

    setImmediate(() => {
        db.initialize().catch(err => {
            console.error('Database initialization failed (non-blocking):', err.message);
        });
    });

    module.exports = db;
}