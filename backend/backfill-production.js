require('dotenv').config();
const { Pool } = require('pg');

// Allocation calculation logic (same as frontend)
function calculateAllocations(fundPerformanceData) {
  const fundData = fundPerformanceData.map(f => ({
    fundName: f.fund_type,
    performance: parseFloat(f.performance) || 0
  }));

  // 1. Base allocation (equal weight)
  const baseAlloc = 100 / fundData.length;

  // 2. Performance-based adjustment
  const performances = fundData.map(f => f.performance);
  const avgPerf = performances.reduce((sum, p) => sum + p, 0) / performances.length;
  const maxPerf = Math.max(...performances);
  const minPerf = Math.min(...performances);
  const perfRange = maxPerf - minPerf || 1;

  // Calculate aggressive allocation
  const aggressiveAlloc = {};
  fundData.forEach(fund => {
    const perfScore = (fund.performance - minPerf) / perfRange;
    const multiplier = 0.5 + (perfScore * 1.5); // Range: 0.5x to 2.0x
    aggressiveAlloc[fund.fundName] = baseAlloc * multiplier;
  });

  // Calculate conservative allocation
  const conservativeAlloc = {};
  fundData.forEach(fund => {
    const isStock = fund.fundName.includes('株式');
    const isBond = fund.fundName.includes('債券') || fund.fundName.includes('公社債');

    if (isBond) {
      conservativeAlloc[fund.fundName] = Math.min(50, baseAlloc * 1.3);
    } else if (isStock) {
      conservativeAlloc[fund.fundName] = baseAlloc * 0.7;
    } else {
      conservativeAlloc[fund.fundName] = baseAlloc;
    }
  });

  // Mix: 60% aggressive + 40% conservative
  const calculations = fundData.map(fund => {
    const aggressive = aggressiveAlloc[fund.fundName] || 0;
    const conservative = conservativeAlloc[fund.fundName] || 0;
    const mixed = aggressive * 0.6 + conservative * 0.4;
    const recommended = Math.round(mixed / 10) * 10;

    return {
      fundName: fund.fundName,
      recommended
    };
  });

  // Adjust to 100% total
  let total = calculations.reduce((sum, calc) => sum + calc.recommended, 0);
  if (total !== 100 && total > 0) {
    const diff = 100 - total;

    if (diff > 0) {
      // Add to highest performing fund
      const sortedCalcs = [...calculations]
        .filter(c => c.recommended > 0)
        .sort((a, b) => {
          const perfA = fundData.find(f => f.fundName === a.fundName)?.performance || 0;
          const perfB = fundData.find(f => f.fundName === b.fundName)?.performance || 0;
          return perfB - perfA;
        });

      if (sortedCalcs.length > 0) {
        const targetFund = calculations.find(c => c.fundName === sortedCalcs[0].fundName);
        if (targetFund) {
          targetFund.recommended += diff;
        }
      }
    } else {
      // Subtract from lowest allocation fund
      const sortedCalcs = [...calculations]
        .filter(c => c.recommended > 0)
        .sort((a, b) => a.recommended - b.recommended);

      let remaining = Math.abs(diff);
      for (const calc of sortedCalcs) {
        if (remaining <= 0) break;

        const targetFund = calculations.find(c => c.fundName === calc.fundName);
        if (targetFund && targetFund.recommended > 0) {
          const reduction = Math.min(remaining, targetFund.recommended);
          targetFund.recommended -= reduction;
          remaining -= reduction;
        }
      }
    }
  }

  return calculations;
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('=== 本番環境: Historical Allocation Backfill ===\n');

    // Step 1: Drop market_data table
    console.log('Step 1: market_dataテーブルを削除中...');
    await pool.query('DROP TABLE IF EXISTS market_data CASCADE');
    console.log('✓ 完了\n');

    // Step 2: Backfill allocations
    console.log('Step 2: 配分データをバックフィル中...\n');

    // Get all companies
    const companies = await pool.query('SELECT id, company_code, company_name FROM insurance_companies WHERE is_active = true');

    console.log(`見つかった会社数: ${companies.rows.length}\n`);

    for (const company of companies.rows) {
      console.log(`\n--- ${company.company_name} (ID: ${company.id}) ---`);

      // Get distinct performance dates
      const dates = await pool.query(`
        SELECT DISTINCT sap.performance_date
        FROM special_account_performance sap
        JOIN special_accounts sa ON sap.special_account_id = sa.id
        WHERE sa.company_id = $1
        ORDER BY sap.performance_date DESC
      `, [company.id]);

      console.log(`履歴データ: ${dates.rows.length}件`);

      if (dates.rows.length === 0) {
        console.log('パフォーマンスデータなし、スキップ...');
        continue;
      }

      for (const dateRow of dates.rows) {
        const performanceDate = dateRow.performance_date;
        console.log(`\n  処理日: ${performanceDate.toISOString().split('T')[0]}`);

        // Get performance data
        const perfData = await pool.query(`
          SELECT sa.account_name as fund_type, sap.return_1m as performance
          FROM special_account_performance sap
          JOIN special_accounts sa ON sap.special_account_id = sa.id
          WHERE sa.company_id = $1 AND sap.performance_date = $2
        `, [company.id, performanceDate]);

        if (perfData.rows.length === 0) {
          console.log(`  データなし、スキップ...`);
          continue;
        }

        console.log(`  ファンド数: ${perfData.rows.length}`);

        // Calculate allocations
        const allocations = calculateAllocations(perfData.rows);

        console.log('  計算された配分:');
        allocations.forEach(alloc => {
          console.log(`    ${alloc.fundName}: ${alloc.recommended}%`);
        });

        // Save allocations
        await pool.query('BEGIN');

        try {
          for (const alloc of allocations) {
            await pool.query(`
              INSERT INTO monthly_allocation_recommendations
              (company_id, recommendation_date, fund_type, recommended_allocation, risk_profile)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (company_id, recommendation_date, fund_type, risk_profile)
              DO UPDATE SET recommended_allocation = $4
            `, [company.id, performanceDate, alloc.fundName, alloc.recommended, 'balanced']);
          }

          await pool.query('COMMIT');
          console.log(`  ✓ 保存完了`);
        } catch (err) {
          await pool.query('ROLLBACK');
          console.error(`  ✗ 保存失敗:`, err.message);
        }
      }
    }

    console.log('\n\n=== バックフィル完了! ===');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ エラー:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
