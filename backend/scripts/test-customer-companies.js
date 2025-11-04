const { Pool } = require('pg');

async function testCustomerCompanies() {
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
    console.log('=== Testing Customer Insurance Companies Flow ===\n');

    // Step 1: Check if table exists and get initial state
    console.log('1. Checking table and initial state...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'customer_insurance_companies'
      );
    `);
    console.log('   Table exists:', tableCheck.rows[0].exists);

    const initialCount = await pool.query('SELECT COUNT(*) FROM customer_insurance_companies');
    console.log('   Initial record count:', initialCount.rows[0].count);

    const initialRecords = await pool.query('SELECT * FROM customer_insurance_companies LIMIT 5');
    console.log('   Initial records:');
    console.table(initialRecords.rows);

    // Step 2: Test setInsuranceCompanies function logic (DELETE + INSERT)
    console.log('\n2. Testing setInsuranceCompanies logic...');

    // Find a customer to test with (customer_id 39 from existing data)
    const testCustomerId = 39;
    console.log(`   Using customer_id: ${testCustomerId}`);

    // Check current companies for this customer
    console.log('   Current companies for customer:');
    const currentCompanies = await pool.query(
      'SELECT * FROM customer_insurance_companies WHERE customer_id = $1',
      [testCustomerId]
    );
    console.table(currentCompanies.rows);

    // Step 3: Test UPDATE scenario - set to [2, 3]
    console.log('\n3. Simulating setInsuranceCompanies([2, 3])...');

    // DELETE all existing
    await pool.query('DELETE FROM customer_insurance_companies WHERE customer_id = $1', [testCustomerId]);
    console.log('   Deleted existing records');

    // INSERT new ones
    const companyIds = [2, 3];
    for (const companyId of companyIds) {
      await pool.query(
        `INSERT INTO customer_insurance_companies (customer_id, insurance_company_id)
         VALUES ($1, $2)
         ON CONFLICT (customer_id, insurance_company_id) DO NOTHING`,
        [testCustomerId, companyId]
      );
    }
    console.log('   Inserted new records for companies:', companyIds);

    // Verify the update
    console.log('   After update:');
    const afterUpdate = await pool.query(
      `SELECT cic.*, ic.company_name, ic.display_name
       FROM customer_insurance_companies cic
       JOIN insurance_companies ic ON cic.insurance_company_id = ic.id
       WHERE cic.customer_id = $1`,
      [testCustomerId]
    );
    console.table(afterUpdate.rows);

    // Step 4: Test retrieval (like GET endpoint does)
    console.log('\n4. Testing getInsuranceCompanies query...');
    const retrieved = await pool.query(
      `SELECT
        cic.id,
        cic.customer_id,
        cic.insurance_company_id,
        cic.joined_date,
        cic.notes,
        ic.company_code,
        ic.company_name,
        ic.display_name
      FROM customer_insurance_companies cic
      JOIN insurance_companies ic ON cic.insurance_company_id = ic.id
      WHERE cic.customer_id = $1
      ORDER BY cic.joined_date DESC`,
      [testCustomerId]
    );
    console.log('   Retrieved companies:');
    console.table(retrieved.rows);

    // Step 5: Restore original state
    console.log('\n5. Restoring original state...');
    await pool.query('DELETE FROM customer_insurance_companies WHERE customer_id = $1', [testCustomerId]);

    if (currentCompanies.rows.length > 0) {
      for (const row of currentCompanies.rows) {
        await pool.query(
          `INSERT INTO customer_insurance_companies (customer_id, insurance_company_id, joined_date, notes)
           VALUES ($1, $2, $3, $4)`,
          [row.customer_id, row.insurance_company_id, row.joined_date, row.notes]
        );
      }
      console.log('   Restored original records');
    }

    const finalCount = await pool.query('SELECT COUNT(*) FROM customer_insurance_companies');
    console.log('   Final record count:', finalCount.rows[0].count);

    console.log('\n✅ All database operations working correctly!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test error:', error);
    await pool.end();
    process.exit(1);
  }
}

testCustomerCompanies();
