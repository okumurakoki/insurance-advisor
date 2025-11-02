const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('./src/utils/database-factory');

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, 'migrations', 'add_custom_monthly_price.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: add_custom_monthly_price.sql');
        console.log('SQL:', migrationSQL);

        await db.query(migrationSQL);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
