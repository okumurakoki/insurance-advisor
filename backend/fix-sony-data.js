const db = require('./src/utils/database-factory');

// From the parsed PDF data
const returns = {
  'SONY_GLOBAL_EQUITY': -1.15,
  'SONY_CORE_GLOBAL_EQUITY': 1.29,
  'SONY_GLOBAL_BOND': -0.11,
  'SONY_DOMESTIC_EQUITY': -1.15,
  'SONY_DOMESTIC_GROWTH': 3.47,
  'SONY_BALANCED_TOTAL': 1.35,
  'SONY_BOND': -0.11,
  'SONY_MONEY_MARKET': 0.04
};

(async () => {
  try {
    console.log('Sony Lifeの8月データに月次リターンを追加中...\n');

    await db.query('BEGIN');

    for (const [accountCode, return1m] of Object.entries(returns)) {
      // Get account ID
      const accounts = await db.query(`
        SELECT id, account_name FROM special_accounts
        WHERE account_code = $1
      `, [accountCode]);

      if (accounts.length === 0) {
        console.log(`⚠️  ${accountCode}: アカウントが見つかりません`);
        continue;
      }

      const accountId = accounts[0].id;
      const accountName = accounts[0].account_name;

      // Update August 2025 data
      const result = await db.query(`
        UPDATE special_account_performance
        SET return_1m = $1
        WHERE special_account_id = $2
        AND performance_date = '2025-08-31'
        AND return_1m IS NULL
      `, [return1m, accountId]);

      if (result.length > 0 || result.rowCount > 0) {
        console.log(`✅ ${accountName}: ${return1m}% に更新`);
      } else {
        console.log(`   ${accountName}: すでに更新済みまたはデータなし`);
      }
    }

    await db.query('COMMIT');
    console.log('\n完了！');

    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error:', err);
    process.exit(1);
  }
})();
