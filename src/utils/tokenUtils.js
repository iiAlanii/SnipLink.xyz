const crypto = require('crypto');

const tokens = new Set();

function generateToken() {
    const newToken = crypto.randomBytes(16).toString('hex');
    tokens.add(newToken);
    return newToken;
}

function validateToken(token) {
    return tokens.has(token);
}

module.exports = { generateToken, validateToken };
