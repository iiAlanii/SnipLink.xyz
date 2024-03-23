const crypto = require('crypto');
const algorithm = process.env.ALGORITHM || 'aes-256-ctr';
const key = Buffer.from(process.env.KEY || 'defaultKey', 'hex');
const originalIv = process.env.IV || 'defaultIV'; //After changing the key, IV and algorithm, change the ones here too after the '||'
let iv = Buffer.from(process.env.IV || 'defaultIV', 'hex');

if (iv.length !== 16) {
    console.error('IV is not 16 bytes long. Generating a new IV...');
    iv = crypto.randomBytes(16);
}
const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (hash) => {
    try {
        const parts = hash.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Error during decryption:', error);
        return 'Decryption Error';
    }
};

module.exports = {
    encrypt,
    decrypt
}