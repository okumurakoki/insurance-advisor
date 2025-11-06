const db = require('./src/utils/database-factory');

(async () => {
  try {
    console.log('Sony Lifeのファンドパフォーマンスデータを確認中...\n');

    const results = await db.query(`
      SELECT
        sa.account_name,
        sa.account_code,
        sap.performance_date,
        sap.unit_price,
        sap.return_1m,
        sap.return_3m,
        sap.return_6m,
        sap.return_1y
      FROM special_accounts sa
      JOIN special_account_performance sap ON sa.id = sap.special_account_id
      WHERE sa.company_id = 3
      ORDER BY sa.account_name, sap.performance_date DESC
    `);

    console.log('結果:', results.length, '件\n');

    // Group by account
    const byAccount = {};
    results.forEach(r => {
      if (!byAccount[r.account_name]) {
        byAccount[r.account_name] = [];
      }
      byAccount[r.account_name].push(r);
    });

    Object.keys(byAccount).forEach(name => {
      console.log('【' + name + '】');
      const latest = byAccount[name][0];
      console.log('  最新: ' + latest.performance_date);
      console.log('  1ヶ月: ' + (latest.return_1m || 'null') + '%');
      console.log('  3ヶ月: ' + (latest.return_3m || 'null') + '%');
      console.log('  6ヶ月: ' + (latest.return_6m || 'null') + '%');
      console.log('  1年: ' + (latest.return_1y || 'null') + '%');
      console.log('  履歴件数: ' + byAccount[name].length + '件');
      console.log('');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
