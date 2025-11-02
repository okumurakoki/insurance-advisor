const fs = require('fs').promises;
const { parsePDF, detectCompany } = require('./src/utils/pdfParser');
const pdf = require('pdf-parse');

async function testPruApril() {
    try {
        console.log('================================================================================');
        console.log('Testing: Prudential April PDF');
        console.log('================================================================================');

        const pdfBuffer = await fs.readFile('/Users/kohki_okumura/Downloads/プルデンシャル-01demo.pdf');

        // Test company detection first
        const data = await pdf(pdfBuffer);
        const detectedCompany = detectCompany(data.text);
        console.log(`✅ Detected Company: ${detectedCompany}`);

        // Parse the PDF
        const parsedData = await parsePDF(pdfBuffer);

        console.log(`\n📅 Data Date: ${parsedData.dataDate}`);
        console.log(`🏢 Company Code: ${parsedData.companyCode}`);
        console.log(`📊 Accounts Found: ${parsedData.accounts.length}`);

        console.log('\nAccount Details:');
        parsedData.accounts.forEach((account, index) => {
            console.log(`\n  ${index + 1}. ${account.accountName}`);
            console.log(`     Code: ${account.accountCode}`);
            console.log(`     Type: ${account.accountType}`);
            if (account.unitPrice !== null && account.unitPrice !== undefined) {
                console.log(`     Unit Price: ${account.unitPrice}`);
            }
            if (account.return1y !== undefined && account.return1y !== null) {
                console.log(`     1Y Return: ${account.return1y}%`);
            }
        });

        console.log(`\n✅ Successfully parsed Prudential April PDF!`);

    } catch (error) {
        console.error(`\n❌ Error parsing:`, error.message);
    }
}

testPruApril().catch(console.error);
