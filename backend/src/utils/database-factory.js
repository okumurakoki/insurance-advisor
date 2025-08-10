// Database factory to switch between different databases based on environment

const usePostgreSQL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const useSQLite = process.env.USE_SQLITE === 'true' || process.env.NODE_ENV === 'demo';

if (usePostgreSQL) {
    console.log('Using PostgreSQL database (Supabase)');
    module.exports = require('./database-postgres');
} else if (useSQLite) {
    console.log('Using SQLite database for demo/development');
    module.exports = require('./database-sqlite');
} else {
    console.log('Using MySQL database');
    module.exports = require('./database');
}