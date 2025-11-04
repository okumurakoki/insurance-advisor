const { Pool } = require('pg');

async function checkTable() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'customer_insurance_companies'
      );
    `);
    console.log('Table customer_insurance_companies exists:', tableCheck.rows[0].exists);
    
    // Count records
    if (tableCheck.rows[0].exists) {
      const count = await pool.query('SELECT COUNT(*) FROM customer_insurance_companies');
      console.log('Records in table:', count.rows[0].count);
      
      // Show sample data
      const sample = await pool.query('SELECT * FROM customer_insurance_companies LIMIT 5');
      console.log('\nSample data:');
      console.table(sample.rows);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTable();
