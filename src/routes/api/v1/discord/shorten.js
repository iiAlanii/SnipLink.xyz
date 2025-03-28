const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Link = require('../../../../models/link');


// Middleware to authenticate the request
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

// Route to shorten a URL
router.post('/shorten', async (req, res) => {
    // Your existing code to shorten a URL goes here
});

module.exports = router;