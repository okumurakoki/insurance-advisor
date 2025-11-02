const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugPrudentialPerformance() {
    const pdfBuffer = await fs.readFile('/Users/kohki_okumura/Downloads/プルデンシャル-01demo.pdf');
    const data = await pdf(pdfBuffer);
    const text = data.text;

    console.log('=== Looking for performance data patterns ===\n');

    // Look for common performance data indicators
    const indicators = ['運用実績', '騰落率', '基準価額', '単位価格', '1ヵ月', '3ヵ月', '6ヵ月', '1年'];

    for (const indicator of indicators) {
        const index = text.indexOf(indicator);
        if (index !== -1) {
            console.log(`\nFound "${indicator}" at position ${index}:`);
            console.log(text.substring(Math.max(0, index - 200), index + 800));
            console.log('\n---');
        }
    }

    console.log('\n\n=== Searching for percentage patterns ===\n');

    // Look for percentage patterns
    const percentagePattern = /([＋\+\-－−△]?\d+\.\d+)[％%]/g;
    const matches = [...text.matchAll(percentagePattern)];

    console.log(`Found ${matches.length} percentage values in the PDF`);

    if (matches.length > 0) {
        console.log('\nFirst 20 percentage values with context:');
        for (let i = 0; i < Math.min(20, matches.length); i++) {
            const match = matches[i];
            const pos = match.index;
            console.log(`\nPosition ${pos}: ${match[0]}`);
            console.log('Context:', text.substring(Math.max(0, pos - 100), pos + 200));
            console.log('---');
        }
    }

    console.log('\n\n=== Looking for specific account names with nearby numbers ===\n');

    const accounts = ['総合型', '株式型', '米国株式型', '世界株式型', '外国株式型', '新興国株式型', '債券型', '世界債券型', '外国債券型', 'REIT型', '米国債券型'];

    for (const account of accounts) {
        const index = text.indexOf(account);
        if (index !== -1) {
            console.log(`\n"${account}" found at position ${index}:`);
            // Look for numbers after the account name
            const afterText = text.substring(index, index + 500);
            console.log(afterText);
            console.log('\n---');
        }
    }
}

debugPrudentialPerformance().catch(console.error);
