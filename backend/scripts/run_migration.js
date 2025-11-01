require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../src/utils/database-factory');

async function runMigration(migrationFile) {
    try {
        console.log(`Running migration: ${migrationFile}`);

        // Wait for DB to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const sqlPath = path.join(__dirname, '..', 'migrations', migrationFile);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove comment-only lines and empty lines
        const lines = sql.split('\n');
        const cleanedLines = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip empty lines and comment-only lines
            if (trimmed && !trimmed.startsWith('--')) {
                cleanedLines.push(line);
            }
        }

        const cleanedSql = cleanedLines.join('\n');

        // Split by semicolons to get individual statements
        const statements = cleanedSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements to execute\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`[${i + 1}/${statements.length}] Executing:`);
            console.log(statement.substring(0, 150) + (statement.length > 150 ? '...' : ''));

            try {
                const result = await db.query(statement);
                console.log('✓ Success\n');
            } catch (error) {
                console.error(`✗ Failed: ${error.message}\n`);
                throw error;
            }
        }

        console.log(`\n✓ Migration completed successfully: ${migrationFile}`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Get migration file from command line argument
const migrationFile = process.argv[2] || 'add_company_id_to_market_data.sql';
runMigration(migrationFile);
