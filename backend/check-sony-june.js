const pdf = require('pdf-parse');
const fs = require('fs').promises;
const { detectCompany } = require('./src/utils/pdfParser');

async function checkSonyJune() {
    const buf = await fs.readFile('/Users/kohki_okumura/Documents/full202506.pdf');
    const data = await pdf(buf);
    const text = data.text;

    console.log('=== Company Detection ===');
    try {
        const company = detectCompany(text);
        console.log(`Detected: ${company}`);
    } catch (error) {
        console.log('Detection failed:', error.message);
    }

    console.log('\n=== First 2000 characters ===');
    console.log(text.substring(0, 2000));

    console.log('\n=== Looking for key identifiers ===');

    const identifiers = [
        'ソニー生命',
        'SOVANI',
        '変額保険',
        '変額個人年金保険',
        '変額保険（特別勘定）の現況',
        '無告知型'
    ];

    for (const identifier of identifiers) {
        const index = text.indexOf(identifier);
        if (index !== -1) {
            console.log(`✅ Found "${identifier}" at position ${index}`);
        } else {
            console.log(`❌ Not found: "${identifier}"`);
        }
    }
}

checkSonyJune().catch(console.error);
