const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugNewPruFormat() {
  const buf = await fs.readFile('/Users/kohki_okumura/Documents/disc_VL_2509_overview.pdf');
  const data = await pdf(buf);
  const text = data.text;

  console.log('=== Looking for summary page ===');
  const summaryIndex = text.indexOf('運用実績サマリー');
  if (summaryIndex !== -1) {
    console.log('Found at position:', summaryIndex);
    console.log(text.substring(summaryIndex, summaryIndex + 2500));
  }

  console.log('\n\n=== Looking for all account types ===');
  const accounts = ['総合型', '債券型', '株式型', '米国債券型', '米国株式型', 'REIT型', '世界株式型', 'マネー型'];

  for (const acc of accounts) {
    const regex = new RegExp(acc + '[\\s\\S]{0,800}', 'g');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      console.log(`\n=== ${acc} ===`);
      console.log(matches[0].substring(0, 600));
    }
  }
}

debugNewPruFormat().catch(console.error);
