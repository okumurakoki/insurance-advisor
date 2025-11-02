const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugProblemPdfs() {
    console.log('=== Investigating SOVANI PDF ===\n');

    const sovaniBuffer = await fs.readFile('/Users/kohki_okumura/Documents/sovanifull202507.pdf');
    const sovaniData = await pdf(sovaniBuffer);
    const sovaniText = sovaniData.text;

    // Check for SOVANI keyword
    const sovaniIndex = sovaniText.indexOf('SOVANI');
    console.log(`"SOVANI" found at position: ${sovaniIndex}`);
    if (sovaniIndex !== -1) {
        console.log('Context around SOVANI:');
        console.log(sovaniText.substring(Math.max(0, sovaniIndex - 100), sovaniIndex + 300));
    }

    // Look for date patterns
    console.log('\n\nLooking for date patterns:');
    const dateMatches = sovaniText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/g);
    if (dateMatches) {
        console.log('Date patterns found:', dateMatches.slice(0, 5));
    }

    // Look for account names in SOVANI pattern
    console.log('\n\nSearching for SOVANI account patterns:');
    const sovaniAccountPattern = /([^\n]+型)\s+([0-9,]+)\s+([0-9.]+)/g;
    const matches = [...sovaniText.matchAll(sovaniAccountPattern)].slice(0, 10);
    matches.forEach(m => {
        console.log(`Account: ${m[1]}, Value1: ${m[2]}, Value2: ${m[3]}`);
    });

    console.log('\n\n=== Investigating Prudential PDF ===\n');

    const pruBuffer = await fs.readFile('/Users/kohki_okumura/Documents/disc_VL_2509_overview.pdf');
    const pruData = await pdf(pruBuffer);
    const pruText = pruData.text;

    // Look for the unit value pattern
    const unitValueIndex = pruText.indexOf('ﾕﾆｯﾄﾊﾞﾘｭｰ');
    console.log(`"ﾕﾆｯﾄﾊﾞﾘｭｰ" found at position: ${unitValueIndex}`);

    if (unitValueIndex === -1) {
        console.log('Trying alternative patterns for unit value...');
        const altPatterns = ['ユニットバリュー', '基準価額', '単位価格'];
        for (const pattern of altPatterns) {
            const idx = pruText.indexOf(pattern);
            if (idx !== -1) {
                console.log(`\nFound "${pattern}" at position ${idx}:`);
                console.log(pruText.substring(idx, idx + 500));
            }
        }
    } else {
        console.log('Context around ﾕﾆｯﾄﾊﾞﾘｭｰ:');
        console.log(pruText.substring(unitValueIndex - 100, unitValueIndex + 500));
    }

    // Look for account names with bullet
    console.log('\n\nSearching for bullet point accounts:');
    const bulletPattern = /[●◆■▲]([^\n]+)/g;
    const bulletMatches = [...pruText.matchAll(bulletPattern)].slice(0, 15);
    bulletMatches.forEach(m => {
        console.log(`Found: ${m[0]}`);
    });

    // Look for date pattern
    console.log('\n\nLooking for date in Prudential PDF:');
    const pruDateMatch = pruText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日現在/);
    if (pruDateMatch) {
        console.log(`Date found: ${pruDateMatch[0]}`);
    }
}

debugProblemPdfs().catch(console.error);
