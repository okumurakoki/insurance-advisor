require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('=== SOVANI の間違ったファンドのみを削除 ===\n');

    // Incorrect fund types (from other companies)
    const incorrectFunds = ['REIT型', '債券型', '株式型', '米国債券型', '米国株式型', '総合型'];

    for (const fundType of incorrectFunds) {
      const result = await pool.query(`
        DELETE FROM monthly_allocation_recommendations 
        WHERE company_id = 4 AND fund_type = $1
      `, [fundType]);

      console.log(`✓ ${fundType}: ${result.rowCount}件削除`);
    }

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
      console.log(`\n  日付: ${date} (${dateGroups[date].length}件)`);
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
