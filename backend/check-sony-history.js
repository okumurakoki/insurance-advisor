const db = require('./src/utils/database-factory');

(async () => {
  try {
    console.log('Sony Lifeの履歴データを確認中...\n');

    // Get one account ID for Sony Life
    const accounts = await db.query(`
      SELECT id, account_name, account_code
      FROM special_accounts
      WHERE company_id = 3
      LIMIT 1
    `);

    if (accounts.length === 0) {
      console.log('Sony Lifeのアカウントが見つかりません');
      process.exit(1);
    }

    const accountId = accounts[0].id;
    console.log('アカウント:', accounts[0].account_name, '(ID:', accountId, ')');
    console.log('');

    // Get ALL historical data for this account
    const history = await db.query(`
      SELECT
        performance_date,
        return_1m,
        return_3m,
        return_6m,
        return_1y,
        created_at
      FROM special_account_performance
      WHERE special_account_id = $1
      ORDER BY performance_date DESC
    `, [accountId]);

    console.log('履歴データ件数:', history.length, '件\n');

    history.forEach((h, i) => {
      console.log(`${i + 1}. ${h.performance_date}`);
      console.log(`   1ヶ月: ${h.return_1m === null ? 'null' : h.return_1m + '%'}`);
      console.log(`   3ヶ月: ${h.return_3m === null ? 'null' : h.return_3m + '%'}`);
      console.log(`   6ヶ月: ${h.return_6m === null ? 'null' : h.return_6m + '%'}`);
      console.log(`   1年: ${h.return_1y === null ? 'null' : h.return_1y + '%'}`);
      console.log(`   登録日: ${h.created_at}`);
      console.log('');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
