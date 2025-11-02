const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugAxaStructure() {
    const pdfBuffer = await fs.readFile('/Users/kohki_okumura/Downloads/アクサdemo1.pdf');
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Look for the performance page more carefully
    console.log('=== Looking for performance data section ===\n');

    // Search around page 5 where performance data should be
    const searchTerm = '運用実績';
    const index = text.indexOf(searchTerm);

    if (index !== -1) {
        console.log(`Found "${searchTerm}" at position ${index}\n`);
        console.log('Context (3000 chars after):');
        console.log(text.substring(index, index + 3000));
    }

    // Also look for specific account names with more context
    console.log('\n\n=== Searching for account name patterns ===\n');

    const accountNames = ['安定成長バランス型', '積極運用バランス型'];
    for (const name of accountNames) {
        const idx = text.indexOf(name);
        if (idx !== -1) {
            console.log(`\nFound "${name}" at position ${idx}`);
            console.log('Context (-200 to +800):');
            console.log(text.substring(Math.max(0, idx - 200), idx + 800));
            console.log('\n---');
        }
    }
}

debugAxaStructure().catch(console.error);
