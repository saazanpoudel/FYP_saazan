const crypto = require('crypto');

const secretKey = '8gBm/:&EnhH.1/q(';
const data = 'total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST';

const hash = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64');

console.log('Generated Hash:', hash);
console.log('Expected Hash:', '4Ov7pCI1zIOdwtV2BRMUNjz1upIlT/COTxfLhWvVurE=');
console.log('MATCH:', hash === '4Ov7pCI1zIOdwtV2BRMUNjz1upIlT/COTxfLhWvVurE=');
