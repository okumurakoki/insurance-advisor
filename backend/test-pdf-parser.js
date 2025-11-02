const fs = require('fs').promises;
const { parseSovaniPDF, validateParsedData } = require('./src/utils/pdfParser');

async function testParser() {
    try {
        console.log('Reading PDF file...');
        const pdfPath = '/Users/kohki_okumura/Downloads/SOVANI 8月.pdf';
        const pdfBuffer = await fs.readFile(pdfPath);

        console.log('Parsing PDF...');
        const result = await parseSovaniPDF(pdfBuffer);

        console.log('\n=== PARSING RESULTS ===\n');
        console.log('Company Code:', result.companyCode);
        console.log('Data Date:', result.dataDate);
        console.log('Total Accounts Found:', result.accounts.length);

        console.log('\n=== ACCOUNT DETAILS ===\n');
        result.accounts.forEach((account, index) => {
            console.log(`${index + 1}. ${account.accountName} (${account.accountCode})`);
            console.log(`   Type: ${account.accountType}`);
            console.log(`   Unit Price: ${account.unitPrice}`);
            console.log(`   Returns: 1M=${account.return1m}%, 3M=${account.return3m}%, 6M=${account.return6m}%, 1Y=${account.return1y}%`);
            console.log('');
        });

        console.log('\n=== VALIDATION ===\n');
        try {
            validateParsedData(result);
            console.log('✅ Data validation passed');
        } catch (validationError) {
            console.log('❌ Data validation failed:', validationError.message);
        }

        // Check expected accounts
        console.log('\n=== COVERAGE CHECK ===\n');
        const expectedAccounts = [
            'バランス型20',
            'バランス型40',
            'バランス型60',
            'バランス型80',
            '日本株式ＴＯＰ型',
            '日本株式ＪＶ型',
            '日本株式ＪＧ型',
            '世界株式ＧＱ型',
            '世界株式ＧＩ型',
            '外国株式ＭＳＰ型',
            '国内債券型',
            '外国債券型',
            '世界債券ＧＤ型',
            '世界ＲＥＩＴ型',
            '日本ＲＥＩＴ型',
            'マネーマーケット型'
        ];

        const foundAccountNames = result.accounts.map(a => a.accountName);
        const missingAccounts = expectedAccounts.filter(name => !foundAccountNames.includes(name));

        if (missingAccounts.length === 0) {
            console.log('✅ All expected accounts found');
        } else {
            console.log('⚠️  Missing accounts:');
            missingAccounts.forEach(name => console.log(`  - ${name}`));
        }

        console.log(`\nCoverage: ${foundAccountNames.length}/${expectedAccounts.length} (${((foundAccountNames.length / expectedAccounts.length) * 100).toFixed(1)}%)`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testParser();
