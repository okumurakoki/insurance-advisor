const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugPDF() {
    try {
        const pdfPath = '/Users/kohki_okumura/Downloads/SOVANI 8月.pdf';
        const pdfBuffer = await fs.readFile(pdfPath);
        const data = await pdf(pdfBuffer);

        console.log('=== PDF METADATA ===');
        console.log('Pages:', data.numpages);
        console.log('Text length:', data.text.length, 'characters');
        console.log('\n=== FIRST 5000 CHARACTERS ===\n');
        console.log(data.text.substring(0, 5000));
        console.log('\n\n=== SEARCHING FOR KEY PATTERNS ===\n');

        // Search for account names
        const accountNames = [
            'バランス型20',
            'バランス型40',
            'バランス型60',
            'バランス型80'
        ];

        accountNames.forEach(name => {
            const index = data.text.indexOf(name);
            if (index !== -1) {
                console.log(`\nFound "${name}" at position ${index}`);
                console.log('Context:');
                console.log(data.text.substring(Math.max(0, index - 100), index + 500));
                console.log('---');
            } else {
                console.log(`\n"${name}" NOT FOUND`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugPDF();
