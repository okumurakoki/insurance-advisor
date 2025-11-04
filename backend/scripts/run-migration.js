const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const migrationFile = process.argv[2];
    if (!migrationFile) {
      console.error('Please provide migration file name');
      console.error('Usage: node run-migration.js <migration-file.sql>');
      process.exit(1);
    }

    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${migrationFile}`);
    await pool.query(sql);
    console.log('Migration completed successfully');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
