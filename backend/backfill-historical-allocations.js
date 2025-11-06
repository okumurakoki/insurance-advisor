require('dotenv').config();
const db = require('./src/utils/database-factory');

/**
 * This script backfills historical allocation recommendations
 * by calculating allocations from past performance data.
 *
 * It reads historical fund_performance data grouped by company and date,
 * calculates the optimal allocations using the same algorithm as the frontend,
 * and saves them to monthly_allocation_recommendations table.
 */

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
  try {
    console.log('=== Backfilling Historical Allocation Recommendations ===\n');

    // Get all companies
    const companies = await db.query('SELECT id, company_code, company_name FROM insurance_companies WHERE is_active = true');

    console.log(`Found ${companies.length} active companies\n`);

    for (const company of companies) {
      console.log(`\n--- Processing: ${company.company_name} (ID: ${company.id}) ---`);

      // Get distinct performance dates for this company from special_account_performance
      const dates = await db.query(`
        SELECT DISTINCT sap.performance_date
        FROM special_account_performance sap
        JOIN special_accounts sa ON sap.special_account_id = sa.id
        WHERE sa.company_id = $1
        ORDER BY sap.performance_date DESC
      `, [company.id]);

      console.log(`Found ${dates.length} historical dates`);

      if (dates.length === 0) {
        console.log('No performance data found, skipping...');
        continue;
      }

      for (const dateRow of dates) {
        const performanceDate = dateRow.performance_date;
        console.log(`\n  Processing date: ${performanceDate}`);

        // Get performance data for this date from special_account_performance
        const perfData = await db.query(`
          SELECT sa.account_name as fund_type, sap.return_1m as performance
          FROM special_account_performance sap
          JOIN special_accounts sa ON sap.special_account_id = sa.id
          WHERE sa.company_id = $1 AND sap.performance_date = $2
        `, [company.id, performanceDate]);

        if (perfData.length === 0) {
          console.log(`  No performance data for ${performanceDate}, skipping...`);
          continue;
        }

        console.log(`  Found ${perfData.length} funds`);

        // Calculate allocations
        const allocations = calculateAllocations(perfData);

        console.log('  Calculated allocations:');
        allocations.forEach(alloc => {
          console.log(`    ${alloc.fundName}: ${alloc.recommended}%`);
        });

        // Save allocations
        await db.query('BEGIN');

        try {
          for (const alloc of allocations) {
            await db.query(`
              INSERT INTO monthly_allocation_recommendations
              (company_id, recommendation_date, fund_type, recommended_allocation, risk_profile)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (company_id, recommendation_date, fund_type, risk_profile)
              DO UPDATE SET recommended_allocation = $4
            `, [company.id, performanceDate, alloc.fundName, alloc.recommended, 'balanced']);
          }

          await db.query('COMMIT');
          console.log(`  ✓ Saved allocations for ${performanceDate}`);
        } catch (err) {
          await db.query('ROLLBACK');
          console.error(`  ✗ Failed to save allocations for ${performanceDate}:`, err.message);
        }
      }
    }

    console.log('\n\n=== Backfill Complete! ===');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
})();
