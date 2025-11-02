require('dotenv').config();
const db = require('./src/utils/database-factory');

async function checkCounts() {
    try {
        const result = await db.query(`
            SELECT 
                ic.company_code,
                ic.display_name,
                COUNT(DISTINCT sa.id) as fund_count
            FROM insurance_companies ic
            LEFT JOIN special_accounts sa ON ic.id = sa.company_id
            GROUP BY ic.id, ic.company_code, ic.display_name
            ORDER BY ic.id
        `);
        
        console.log('\n📊 ファンド数:');
        result.forEach(row => {
            console.log(`  ${row.display_name}: ${row.fund_count}ファンド`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.close();
    }
}

checkCounts();
