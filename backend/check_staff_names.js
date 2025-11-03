const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.skqzxkdwzxjsonkwoeua:Akira0204@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function checkStaff() {
  try {
    const result = await pool.query('SELECT id, user_id, name, email, parent_id FROM users WHERE parent_id = 4 ORDER BY id');
    console.log('Staff members under parent_id=4:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkStaff();
