const db = require('./src/utils/database-factory');

(async () => {
  try {
    console.log('パフォーマンスデータの日付を確認中...\n');

    // Get all distinct performance dates across all companies
    const dates = await db.query(`
      SELECT DISTINCT
        sap.performance_date,
        ic.display_name as company_name,
        COUNT(*) as record_count
      FROM special_account_performance sap
      JOIN special_accounts sa ON sa.id = sap.special_account_id
      JOIN insurance_companies ic ON ic.id = sa.company_id
      GROUP BY sap.performance_date, ic.display_name
      ORDER BY sap.performance_date DESC, ic.display_name
      LIMIT 20
    `);

    console.log('最近のパフォーマンスデータ:');
    dates.forEach(d => {
      console.log(`  ${d.performance_date} - ${d.company_name} (${d.record_count}件)`);
    });

    // Check if we have multiple months of data for comparison
    console.log('\n\n各社の月別データ数:');
    const monthlyCounts = await db.query(`
      SELECT
        ic.display_name as company_name,
        COUNT(DISTINCT sap.performance_date) as month_count,
        MIN(sap.performance_date) as earliest,
        MAX(sap.performance_date) as latest
      FROM special_account_performance sap
      JOIN special_accounts sa ON sa.id = sap.special_account_id
      JOIN insurance_companies ic ON ic.id = sa.company_id
      GROUP BY ic.display_name
      ORDER BY ic.display_name
    `);

    monthlyCounts.forEach(c => {
      console.log(`  ${c.company_name}: ${c.month_count}ヶ月分 (${c.earliest} 〜 ${c.latest})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
