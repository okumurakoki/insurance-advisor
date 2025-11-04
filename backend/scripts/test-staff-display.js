require('dotenv').config();
const { Pool } = require('pg');

async function testStaffDisplay() {
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
    console.log('=== Testing Staff Display with COALESCE ===\n');

    // Test the exact query used in getByAgencyId
    console.log('1. Testing getByAgencyId query (parent account)...');
    const agencyQuery = await pool.query(`
      SELECT
        c.id,
        c.name as customer_name,
        u.user_id as staff_user_id,
        u.id as staff_id,
        u.name as original_staff_name,
        COALESCE(u.name, u.user_id) as staff_name,
        c.insurance_company_id,
        ic.company_code,
        ic.company_name,
        ic.display_name
      FROM customers c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN insurance_companies ic ON c.insurance_company_id = ic.id
      WHERE c.is_active = TRUE
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    console.log('\n   Results from agency query:');
    console.table(agencyQuery.rows.map(r => ({
      customer_id: r.id,
      customer_name: r.customer_name,
      staff_user_id: r.staff_user_id,
      original_name: r.original_staff_name,
      staff_name: r.staff_name,
      company: r.display_name || r.company_name
    })));

    // Test the exact query used in getByUserId
    console.log('\n2. Testing getByUserId query (child account)...');
    const userQuery = await pool.query(`
      SELECT
        c.id,
        c.name as customer_name,
        c.insurance_company_id,
        ic.company_code,
        ic.company_name,
        ic.display_name,
        u.user_id as staff_user_id,
        u.name as original_staff_name,
        COALESCE(u.name, u.user_id) as staff_name
      FROM customers c
      LEFT JOIN insurance_companies ic ON c.insurance_company_id = ic.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.is_active = TRUE
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    console.log('\n   Results from user query:');
    console.table(userQuery.rows.map(r => ({
      customer_id: r.id,
      customer_name: r.customer_name,
      staff_user_id: r.staff_user_id,
      original_name: r.original_staff_name,
      staff_name: r.staff_name,
      company: r.display_name || r.company_name
    })));

    // Verify COALESCE is working
    console.log('\n3. Verification:');
    const nullNameCount = agencyQuery.rows.filter(r => r.staff_name === null).length;
    const hasStaffName = agencyQuery.rows.filter(r => r.staff_name !== null).length;

    console.log(`   - Records with staff_name: ${hasStaffName}`);
    console.log(`   - Records with NULL staff_name: ${nullNameCount}`);

    if (nullNameCount === 0 && hasStaffName > 0) {
      console.log('\n✅ COALESCE is working correctly! All records have staff_name.');
    } else if (nullNameCount > 0) {
      console.log('\n❌ WARNING: Some records still have NULL staff_name.');
    } else {
      console.log('\n⚠️  No records found to test.');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test error:', error);
    await pool.end();
    process.exit(1);
  }
}

testStaffDisplay();
