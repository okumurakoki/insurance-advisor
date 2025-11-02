const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function checkOldSovani() {
  const buf = await fs.readFile('/Users/kohki_okumura/Documents/sovanifull.pdf');
  const data = await pdf(buf);
  console.log('Total pages:', data.numpages);
  console.log('Text length:', data.text.length);
  console.log('\nFirst 2000 characters:');
  console.log(data.text.substring(0, 2000));
  console.log('\n\n=== Searching for SOVANI keyword ===');
  const sovaniIndex = data.text.indexOf('SOVANI');
  console.log('SOVANI found at position:', sovaniIndex);
  if (sovaniIndex !== -1) {
    console.log('Context:');
    console.log(data.text.substring(sovaniIndex - 100, sovaniIndex + 300));
  }
  console.log('\n\n=== Searching for date ===');
  const dateMatch = data.text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日現在/);
  if (dateMatch) {
    console.log('Date found:', dateMatch[0]);
  }
}

checkOldSovani().catch(console.error);
