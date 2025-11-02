const pdf = require('pdf-parse');
const fs = require('fs').promises;

async function debugPruJulyDate() {
  const buf = await fs.readFile('/Users/kohki_okumura/Documents/プルデンシャルデータ版_7月.pdf');
  const data = await pdf(buf);
  const text = data.text;

  console.log('=== Looking for date patterns ===');

  // Try various date patterns
  const patterns = [
    /(\\d{4})年(\\d{1,2})月(\\d{1,2})日現在/,
    /(\\d{4})年(\\d{1,2})月(\\d{1,2})日/,
    /(\\d{4})\/(\\d{1,2})\/(\\d{1,2})/,
    /現在日付[：:](\\d{4})年(\\d{1,2})月(\\d{1,2})日/,
    /基準日[：:](\\d{4})年(\\d{1,2})月(\\d{1,2})日/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log(`Found with pattern ${pattern}:`, match[0]);
    }
  }

  console.log('\\n=== First 2000 characters ===');
  console.log(text.substring(0, 2000));
}

debugPruJulyDate().catch(console.error);
