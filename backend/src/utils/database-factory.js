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

    // Initialize database synchronously to ensure it's ready before handling requests
    let initPromise = null;
    const originalQuery = db.query;

    db.query = async function(...args) {
        // Wait for initialization if it hasn't completed
        if (!db.pool) {
            if (!initPromise) {
                initPromise = db.initialize();
            }
            await initPromise;
        }
        return originalQuery.apply(db, args);
    };

    // Start initialization immediately but don't block module export
    db.initialize().catch(err => {
        console.error('Database initialization error:', err);
    });

    module.exports = db;
} else {
    // Fallback to simple in-memory database
    console.log('Using simple in-memory database (fallback)');
    const db = require('./database-simple');
    db.initialize().catch(console.error);
    module.exports = db;
}