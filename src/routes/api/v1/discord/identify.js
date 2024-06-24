const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../../../../models/user');
router.use((req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
        }

        req.clientIdentifier = decoded.id;
        next();
    });
});

router.get('/identify', async (req, res) => {
    const discordId = req.clientIdentifier;

    const user = await User.findOne({ discordId: discordId });

    if (user) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
});
module.exports = router;