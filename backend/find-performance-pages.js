const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function findPerformancePages() {
    const pdfs = [
        {
            name: 'AXA',
            path: '/Users/kohki_okumura/Downloads/アクサdemo1.pdf',
            // Search for unit price pattern (指数)
            searchPattern: '指数'
        },
        {
            name: 'Sony',
            path: '/Users/kohki_okumura/Downloads/ソニーdemo.pdf',
            searchPattern: '基準価額'
        }
    ];

    for (const pdfInfo of pdfs) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log(`=== ${pdfInfo.name} - Looking for performance table ===`);
            console.log('='.repeat(80));

            const pdfBuffer = await fs.readFile(pdfInfo.path);
            const data = await pdf(pdfBuffer);

            // Search for all occurrences of the pattern
            let currentIndex = 0;
            let occurrence = 0;

            while (true) {
                const index = data.text.indexOf(pdfInfo.searchPattern, currentIndex);
                if (index === -1) break;

                occurrence++;
                console.log(`\n--- Occurrence #${occurrence} at position ${index} ---`);
                console.log(data.text.substring(Math.max(0, index - 200), index + 500));

                currentIndex = index + 1;

                if (occurrence >= 5) break; // Show first 5 occurrences
            }

        } catch (error) {
            console.error(`Error processing ${pdfInfo.name}:`, error.message);
        }
    }
}

findPerformancePages();
