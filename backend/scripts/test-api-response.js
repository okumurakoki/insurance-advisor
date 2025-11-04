// Test what the production API is returning
const https = require('https');

async function testAPIResponse() {
  console.log('=== Testing Production API Response ===\n');

  // You'll need to replace this with actual auth token
  console.log('To test the API, you need to:');
  console.log('1. Log in to https://app.insurance-optimizer.com/');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Go to Application tab > Local Storage');
  console.log('4. Copy the auth token');
  console.log('5. Make a request like:');
  console.log('');
  console.log('curl -H "Authorization: Bearer YOUR_TOKEN_HERE" https://prudential-insurance-optimizer-api.vercel.app/api/customers | json_pp');
  console.log('');
  console.log('Look for the "staff_name" field in the response.');
  console.log('');
  console.log('Expected: "staff_name": "agent_k"');
  console.log('If missing: Backend not deployed correctly');
  console.log('If null: Database query issue');
}

testAPIResponse();
