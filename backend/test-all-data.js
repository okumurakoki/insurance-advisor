const PDFParser = require('./src/utils/pdf-parser');
const fs = require('fs');

(async () => {
  try {
    const pdfBuffer = fs.readFileSync('/Users/kohki_okumura/Downloads/demo3.pdf');
    console.log('PDF buffer size:', pdfBuffer.length);
    
    const result = await PDFParser.extractAllData(pdfBuffer);
    
    console.log('\n=== 抽出結果 ===');
    console.log('\n1. Fund Performance (直近1年):');
    console.log(JSON.stringify(result.fundPerformance, null, 2));
    
    console.log('\n2. All Performance Data:');
    console.log('\n累積騰落率 (Total Return):');
    console.log(JSON.stringify(result.allPerformanceData.totalReturn, null, 2));
    
    console.log('\n年率換算利回り (Annualized Return):');
    console.log(JSON.stringify(result.allPerformanceData.annualizedReturn, null, 2));
    
    console.log('\n月次利回り (Monthly Return):');
    console.log(JSON.stringify(result.allPerformanceData.monthlyReturn, null, 2));
    
    console.log('\n3. Report Date:', result.reportDate);
  } catch (error) {
    console.error('エラー:', error.message);
    console.error(error.stack);
  }
})();
