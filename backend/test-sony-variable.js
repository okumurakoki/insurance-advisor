const fs = require('fs');
const parser = require('./src/utils/pdf-parser');

async function testSONYVariablePDF() {
    try {
        console.log('Loading SONY Variable Life PDF...');
        const pdfBuffer = fs.readFileSync('/Users/kohki_okumura/Downloads/ソニーdemo.pdf');
        console.log('PDF Buffer size:', pdfBuffer.length);

        console.log('\n=== Testing extractText ===');
        const text = await parser.extractText(pdfBuffer);
        console.log('Extracted text length:', text.length);
        console.log('First 1000 chars:', text.substring(0, 1000));

        console.log('\n=== Testing extractPerformanceTable (SONY_LIFE) ===');
        const performance = parser.extractPerformanceTable(text, 'SONY_LIFE');
        console.log('Extracted performance:', JSON.stringify(performance, null, 2));

        // Show lines around where fund names appear
        console.log('\n=== Looking for fund names in text ===');
        const lines = text.split('\n');
        const fundNames = ['株式型', '日本成長株式型', '世界コア株式型', '世界株式型', '債券型', '世界債券型', '総合型', '短期金融市場型'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const matchedFunds = fundNames.filter(name => line.includes(name));
            if (matchedFunds.length >= 2) {
                console.log(`\nLine ${i}: ${line}`);
                console.log(`  Next line ${i+1}: ${lines[i+1]}`);
                console.log(`  Next line ${i+2}: ${lines[i+2]}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
        console.error('Stack:', error.stack);
    }
}

testSONYVariablePDF();
