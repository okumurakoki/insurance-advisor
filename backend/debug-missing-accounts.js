const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugMissingAccounts() {
    console.log('=== AXA Missing Accounts ===\n');

    const axaPdfBuffer = await fs.readFile('/Users/kohki_okumura/Downloads/アクサdemo1.pdf');
    const axaData = await pdf(axaPdfBuffer);
    const axaText = axaData.text;

    const axaMissing = ['外国株式型', '新興国株式型', '世界株式プラス型'];

    for (const name of axaMissing) {
        const index = axaText.indexOf(name);
        if (index !== -1) {
            console.log(`\n"${name}" found at ${index}:`);
            console.log(axaText.substring(Math.max(0, index - 100), index + 400));
            console.log('\n---');
        } else {
            console.log(`\n"${name}" NOT FOUND in PDF`);
        }
    }

    console.log('\n\n=== Prudential Missing Accounts ===\n');

    const pruPdfBuffer = await fs.readFile('/Users/kohki_okumura/Downloads/プルデンシャル-01demo.pdf');
    const pruData = await pdf(pruPdfBuffer);
    const pruText = pruData.text;

    const pruMissing = ['総合型', '株式型', '米国株式型'];

    for (const name of pruMissing) {
        const index = pruText.indexOf(name);
        if (index !== -1) {
            console.log(`\n"${name}" found at ${index}:`);
            console.log(pruText.substring(Math.max(0, index - 100), index + 600));
            console.log('\n---');
        } else {
            console.log(`\n"${name}" NOT FOUND in PDF`);
        }
    }
}

debugMissingAccounts().catch(console.error);
