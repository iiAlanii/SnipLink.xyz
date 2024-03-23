const crypto = require('crypto');
const authKeys = new Set();

function generateAuthKey() {
    const authKey = crypto.randomBytes(16).toString('hex');
    authKeys.add(authKey);
    return authKey;
}
function validateAuthKey(authKey) {
    if (authKeys.has(authKey)) {
        authKeys.delete(authKey);
        return true;
    }
    return false;
}

function authMiddleware(req, res, next) {
    const authKey = req.headers['x-auth-key'];


    if (!authKey || !validateAuthKey(authKey)) {
        res.status(401).json({ error: 'Unauthorized' });
    } else {
        next();
    }
}

module.exports = { generateAuthKey, authMiddleware };
