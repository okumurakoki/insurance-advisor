const pdfParse = require('pdf-parse');
const fs = require('fs');

(async () => {
  try {
    const pdfBuffer = fs.readFileSync('/Users/kohki_okumura/Downloads/demo3.pdf');
    const parser = new pdfParse.PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    await parser.destroy();
    
    const text = result.text;
    const lines = text.split('\n');
    
    // Find the performance table section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('直近1年') && line.includes('6.75%')) {
        console.log('=== Performance Table Section ===\n');
        // Print 20 lines around the match
        const start = Math.max(0, i - 3);
        const end = Math.min(lines.length, i + 17);
        
        for (let j = start; j < end; j++) {
          console.log(`${j}: ${lines[j]}`);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
