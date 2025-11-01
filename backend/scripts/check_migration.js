require('dotenv').config();

const db = require('../src/utils/database-factory');

async function checkMigration() {
    try {
        // Wait a moment for DB to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if company_id column exists in market_data table
        const checkColumn = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'market_data'
            AND column_name = 'company_id'
        `);

        if (checkColumn && checkColumn.length > 0) {
            console.log('✓ company_id column exists in market_data table');
            console.log('Column details:', checkColumn[0]);
        } else {
            console.log('✗ company_id column NOT found in market_data table');
        }

        // Check if data was migrated to Prudential
        const checkData = await db.query(`
            SELECT
                COUNT(*) as total_records,
                COUNT(company_id) as records_with_company,
                COUNT(*) FILTER (WHERE company_id IS NULL) as records_without_company
            FROM market_data
        `);

        console.log('\nMarket data migration status:');
        console.log(checkData[0]);

        // Check which companies the records are assigned to
        const companyDist = await db.query(`
            SELECT
                ic.company_code,
                ic.company_name,
                COUNT(md.id) as pdf_count
            FROM market_data md
            LEFT JOIN insurance_companies ic ON md.company_id = ic.id
            GROUP BY ic.id, ic.company_code, ic.company_name
            ORDER BY pdf_count DESC
        `);

        console.log('\nPDF distribution by company:');
        console.log(companyDist);

        process.exit(0);
    } catch (error) {
        console.error('Error checking migration:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkMigration();
