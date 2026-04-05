const crypto = require('crypto');

const secretKey = '8gBm/:&EnhH.1/q(';
const data = 'total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST';

const hash = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64');

console.log('--- TEST 1 (with labels, comma) ---');
console.log('Result:', hash);
console.log('Expected:', '4Ov7pCI1zIOdwtV2BRMUNjz1upIlT/COTxfLhWvVurE=');
console.log('Match:', hash === '4Ov7pCI1zIOdwtV2BRMUNjz1upIlT/COTxfLhWvVurE=');

const data2 = '100,11-201-13,EPAYTEST';
const hash2 = crypto
    .createHmac('sha256', secretKey)
    .update(data2)
    .digest('base64');

console.log('\n--- TEST 2 (no labels, comma) ---');
console.log('Result:', hash2);

const data3 = 'total_amount=100transaction_uuid=11-201-13product_code=EPAYTEST';
const hash3 = crypto
    .createHmac('sha256', secretKey)
    .update(data3)
    .digest('base64');

console.log('\n--- TEST 3 (labels, no comma) ---');
console.log('Result:', hash3);
