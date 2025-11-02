const fs = require('fs').promises;
const { parsePDF, detectCompany } = require('./src/utils/pdfParser');

async function testAllParsers() {
    const pdfs = [
        {
            name: 'Sony Life Variable Life',
            path: '/Users/kohki_okumura/Downloads/ソニーdemo.pdf'
        },
        {
            name: 'AXA Life',
            path: '/Users/kohki_okumura/Downloads/アクサdemo1.pdf'
        },
        {
            name: 'Prudential Life',
            path: '/Users/kohki_okumura/Downloads/プルデンシャル-01demo.pdf'
        }
    ];

    for (const pdfInfo of pdfs) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log(`Testing: ${pdfInfo.name}`);
            console.log('='.repeat(80));

            const pdfBuffer = await fs.readFile(pdfInfo.path);

            // Test company detection first
            const pdf = require('pdf-parse');
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
                if (account.unitPrice !== null) {
                    console.log(`     Unit Price: ${account.unitPrice}`);
                }
                if (account.return1m !== undefined && account.return1m !== null) {
                    console.log(`     1M Return: ${account.return1m}%`);
                }
                if (account.return3m !== undefined && account.return3m !== null) {
                    console.log(`     3M Return: ${account.return3m}%`);
                }
                if (account.return6m !== undefined && account.return6m !== null) {
                    console.log(`     6M Return: ${account.return6m}%`);
                }
                if (account.return1y !== undefined && account.return1y !== null) {
                    console.log(`     1Y Return: ${account.return1y}%`);
                }
            });

            console.log(`\n✅ Successfully parsed ${pdfInfo.name}!`);

        } catch (error) {
            console.error(`\n❌ Error parsing ${pdfInfo.name}:`);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

testAllParsers().then(() => {
    console.log('\n\n' + '='.repeat(80));
    console.log('Testing complete!');
    console.log('='.repeat(80));
}).catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
});
