const db = require('./src/utils/database-factory');

/**
 * This script populates the monthly_allocation_recommendations table
 * with historical allocation data based on the SOVANI July example provided by the user.
 *
 * User's example (July SOVANI バランス型):
 * - 日本株式型TOP: 10%
 * - 日本株式型JV: 20%
 * - 日本株式型JG: 10%
 * - 世界株式型GI: 40%
 * - 海外株式型MSP: 20%
 */

(async () => {
  try {
    console.log('Populating historical allocation recommendations...\n');

    // Get SOVANI company ID
    const companies = await db.query(
      'SELECT id FROM insurance_companies WHERE company_code = $1',
      ['SONY_LIFE_SOVANI']
    );

    if (companies.length === 0) {
      console.log('SOVANI company not found');
      process.exit(1);
    }

    const companyId = companies[0].id;
    console.log(`SOVANI company_id: ${companyId}`);

    // July 2025 balanced allocation example (from user)
    const julyAllocations = [
      { fundType: '日本株式型TOP', allocation: 10 },
      { fundType: '日本株式型JV', allocation: 20 },
      { fundType: '日本株式型JG', allocation: 10 },
      { fundType: '世界株式型GI', allocation: 40 },
      { fundType: '海外株式型MSP', allocation: 20 }
    ];

    // Insert July balanced allocations
    await db.query('BEGIN');

    try {
      for (const { fundType, allocation } of julyAllocations) {
        await db.query(
          `INSERT INTO monthly_allocation_recommendations
           (company_id, recommendation_date, fund_type, recommended_allocation, risk_profile)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, recommendation_date, fund_type, risk_profile) DO UPDATE
           SET recommended_allocation = $4`,
          [companyId, '2025-07-31', fundType, allocation, 'balanced']
        );
        console.log(`✓ Inserted: ${fundType} - ${allocation}% (Balanced, July 2025)`);
      }

      await db.query('COMMIT');
      console.log('\n✅ Historical data populated successfully!');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
