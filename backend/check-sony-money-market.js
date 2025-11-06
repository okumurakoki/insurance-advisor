const db = require('./src/utils/database-factory');

(async () => {
  try {
    console.log('Sony Lifeの短期金融市場型を確認中...\n');

    // Check if the account exists
    const accounts = await db.query(`
      SELECT id, account_name, account_code, account_type
      FROM special_accounts
      WHERE company_id = 3
      AND (account_name LIKE '%短期%' OR account_code = 'SONY_MONEY_MARKET')
    `);

    if (accounts.length === 0) {
      console.log('❌ 短期金融市場型のアカウントが見つかりません');

      // Check all Sony Life accounts
      const allAccounts = await db.query(`
        SELECT id, account_name, account_code, account_type
        FROM special_accounts
        WHERE company_id = 3
        ORDER BY account_name
      `);

      console.log('\nSony Lifeの全アカウント:');
      allAccounts.forEach(acc => {
        console.log(`  - ${acc.account_name} (${acc.account_code})`);
      });
    } else {
      console.log('✅ 短期金融市場型のアカウントが見つかりました:\n');
      accounts.forEach(acc => {
        console.log(`ID: ${acc.id}`);
        console.log(`名前: ${acc.account_name}`);
        console.log(`コード: ${acc.account_code}`);
        console.log(`タイプ: ${acc.account_type}\n`);
      });

      // Get performance data
      for (const acc of accounts) {
        const perf = await db.query(`
          SELECT performance_date, return_1m, return_1y
          FROM special_account_performance
          WHERE special_account_id = $1
          ORDER BY performance_date DESC
          LIMIT 3
        `, [acc.id]);

        console.log(`パフォーマンスデータ (最新3件):`);
        perf.forEach(p => {
          console.log(`  ${p.performance_date}: 1ヶ月=${p.return_1m}%, 1年=${p.return_1y}%`);
        });
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
