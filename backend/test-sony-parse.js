const fs = require('fs');
const { parseSonyLifePDF } = require('./src/utils/pdfParser');

(async () => {
  try {
    console.log('Sony Life PDFをパース中...\n');

    const pdfPath = '/Users/kohki_okumura/Downloads/ソニーdemo.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);

    const result = await parseSonyLifePDF(pdfBuffer);

    console.log('パース結果:');
    console.log('Company Code:', result.companyCode);
    console.log('Data Date:', result.dataDate);
    console.log('Accounts:', result.accounts.length, '件\n');

    result.accounts.forEach(acc => {
      console.log('【' + acc.accountName + '】');
      console.log('  Code:', acc.accountCode);
      console.log('  Type:', acc.accountType);
      console.log('  Unit Price:', acc.unitPrice || 'undefined');
      console.log('  Return 1M:', acc.return1m !== undefined ? acc.return1m + '%' : 'undefined');
      console.log('  Return 3M:', acc.return3m !== undefined ? acc.return3m + '%' : 'undefined');
      console.log('  Return 6M:', acc.return6m !== undefined ? acc.return6m + '%' : 'undefined');
      console.log('  Return 1Y:', acc.return1y !== undefined ? acc.return1y + '%' : 'undefined');
      console.log('');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
