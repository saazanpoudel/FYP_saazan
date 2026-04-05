const crypto = require('crypto');

/**
 * Generate eSewa v2 signature
 * @param {string} total_amount 
 * @param {string} transaction_uuid 
 * @param {string} product_code 
 * @param {string} secret_key 
 * @returns {string} signature (base64)
 */
const generateEsewaSignature = (total_amount, transaction_uuid, product_code, secret_key) => {
    const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    
    return crypto
        .createHmac('sha256', secret_key)
        .update(data)
        .digest('base64');
};

/**
 * General eSewa signature generator based on field names and order
 * @param {Object} payload The data payload (decoded base64 from eSewa)
 * @param {string} secretKey The eSewa secret key
 * @returns {string} signature (base64)
 */
const verifyEsewaSignature = (payload, secretKey) => {
    const { signed_field_names, signature } = payload;
    const fields = signed_field_names.split(',');
    
    const dataArray = fields.map(field => `${field}=${payload[field]}`);
    const dataString = dataArray.join(',');
    
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(dataString);
    const hashInBase64 = hmac.digest('base64');
    
    return hashInBase64 === signature;
};

module.exports = { generateEsewaSignature, verifyEsewaSignature };
