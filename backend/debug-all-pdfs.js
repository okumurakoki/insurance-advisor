const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugAllPDFs() {
    const pdfs = [
        {
            name: 'AXA',
            path: '/Users/kohki_okumura/Downloads/アクサdemo1.pdf'
        },
        {
            name: 'Sony',
            path: '/Users/kohki_okumura/Downloads/ソニーdemo.pdf'
        },
        {
            name: 'Prudential',
            path: '/Users/kohki_okumura/Downloads/プルデンシャル-01demo.pdf'
        }
    ];

    for (const pdfInfo of pdfs) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log(`=== ${pdfInfo.name} PDF ===`);
            console.log('='.repeat(80));

            const pdfBuffer = await fs.readFile(pdfInfo.path);
            const data = await pdf(pdfBuffer);

            console.log('\n--- METADATA ---');
            console.log('Pages:', data.numpages);
            console.log('Text length:', data.text.length, 'characters');

            console.log('\n--- FIRST 3000 CHARACTERS ---');
            console.log(data.text.substring(0, 3000));

            console.log('\n--- DATE PATTERN SEARCH ---');
            const datePatterns = [
                /(\d{4})年(\d{1,2})月(\d{1,2})日現在/,
                /(\d{4})年(\d{1,2})月末現在/,
                /令和(\d+)年(\d{1,2})月(\d{1,2})日現在/
            ];

            for (let i = 0; i < datePatterns.length; i++) {
                const match = data.text.match(datePatterns[i]);
                if (match) {
                    console.log(`Pattern ${i + 1} matched:`, match[0]);
                }
            }

            console.log('\n--- SEARCHING FOR ACCOUNT NAMES ---');
            const accountKeywords = [
                'バランス型', '株式型', '債券型', 'リート型', 'REIT型',
                'マネー型', '安定', '積極', '成長'
            ];

            for (const keyword of accountKeywords) {
                const index = data.text.indexOf(keyword);
                if (index !== -1) {
                    console.log(`\nFound "${keyword}" at position ${index}`);
                    console.log('Context:');
                    console.log(data.text.substring(Math.max(0, index - 50), index + 300));
                    console.log('---');
                }
            }

        } catch (error) {
            console.error(`Error processing ${pdfInfo.name}:`, error.message);
        }
    }
}

debugAllPDFs();
