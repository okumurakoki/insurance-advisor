const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

(async () => {
  try {
    const apiUrl = 'https://api.insurance-optimizer.com';

    // Step 1: Generate JWT token
    console.log('1. JWTトークンを生成中...');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || '60d154818573b389ced2f9118b95bc81c0829475cb3433337fe15a236b1d5ceb';

    const token = jwt.sign(
      {
        userId: '728270f2-636e-4607-9d80-96a1897a4f70', // Admin user ID
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ トークン生成完了\n');

    // Step 2: Upload PDF
    console.log('2. PDFをアップロード中...');
    const pdfPath = '/Users/kohki_okumura/Downloads/ソニーdemo.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);

    const formData = new FormData();
    formData.append('pdf', pdfBuffer, {
      filename: 'ソニーdemo.pdf',
      contentType: 'application/pdf'
    });

    const uploadUrl = `${apiUrl}/api/pdf-upload/auto`;
    console.log('URL:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ アップロード成功!\n');
      console.log('結果:');
      console.log('  Company:', result.data.companyCode);
      console.log('  Data Date:', result.data.dataDate);
      console.log('  Total Accounts:', result.data.totalAccounts);
      console.log('  New Accounts:', result.data.newAccountsCreated);
      console.log('  New Performance Records:', result.data.newPerformanceRecords);
      console.log('  Updated Performance Records:', result.data.updatedPerformanceRecords);
    } else {
      console.error('❌ アップロード失敗');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }

    process.exit(response.ok ? 0 : 1);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
