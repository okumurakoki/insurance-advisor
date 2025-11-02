const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function extractPerformanceData() {
    const pdfs = [
        {
            name: 'AXA',
            path: '/Users/kohki_okumura/Downloads/アクサdemo1.pdf',
            searchPattern: '安定成長'
        },
        {
            name: 'Sony',
            path: '/Users/kohki_okumura/Downloads/ソニーdemo.pdf',
            searchPattern: '世界株式型'
        },
        {
            name: 'Prudential',
            path: '/Users/kohki_okumura/Downloads/プルデンシャル-01demo.pdf',
            searchPattern: '総合型'
        }
    ];

    for (const pdfInfo of pdfs) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log(`=== ${pdfInfo.name} - Performance Data Section ===`);
            console.log('='.repeat(80));

            const pdfBuffer = await fs.readFile(pdfInfo.path);
            const data = await pdf(pdfBuffer);

            // Find the performance data section
            const index = data.text.indexOf(pdfInfo.searchPattern);
            if (index !== -1) {
                console.log('\nFound performance table at position:', index);
                console.log('\n--- Context (500 chars before and 2000 chars after) ---');
                console.log(data.text.substring(Math.max(0, index - 500), index + 2000));
            }

        } catch (error) {
            console.error(`Error processing ${pdfInfo.name}:`, error.message);
        }
    }
}

extractPerformanceData();
