require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('=== SOVANI 2025-11-05 の間違ったデータを削除 ===\n');

    // First, check what data exists for SOVANI on 2025-11-05
    const beforeData = await pool.query(`
      SELECT recommendation_date, fund_type, recommended_allocation
      FROM monthly_allocation_recommendations
      WHERE company_id = 4 AND recommendation_date = '2025-11-05'
      ORDER BY fund_type
    `);

    console.log(`削除前のデータ (${beforeData.rows.length}件):`);
    beforeData.rows.forEach(row => {
      console.log(`  - ${row.fund_type}: ${row.recommended_allocation}%`);
    });

    // Delete the incorrect data
    const result = await pool.query(`
      DELETE FROM monthly_allocation_recommendations 
      WHERE company_id = 4 AND recommendation_date = '2025-11-05'
    `);

    console.log(`\n✓ ${result.rowCount}件のデータを削除しました`);

    // Verify remaining SOVANI data
    const afterData = await pool.query(`
      SELECT recommendation_date, fund_type, recommended_allocation
      FROM monthly_allocation_recommendations
      WHERE company_id = 4
      ORDER BY recommendation_date DESC, fund_type
    `);

    console.log(`\n残っているSOVANIデータ (${afterData.rows.length}件):`);
    const dateGroups = {};
    afterData.rows.forEach(row => {
      const date = row.recommendation_date.toISOString().split('T')[0];
      if (!dateGroups[date]) dateGroups[date] = [];
      dateGroups[date].push(row);
    });

    Object.keys(dateGroups).forEach(date => {
      console.log(`\n  日付: ${date}`);
      dateGroups[date].forEach(row => {
        console.log(`    - ${row.fund_type}: ${row.recommended_allocation}%`);
      });
    });

    console.log('\n✅ 完了!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ エラー:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
