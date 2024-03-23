const express = require('express');
const router = express.Router();
const Link = require('../models/link');
const logGeneralError = require('../middleware/generalErrorLogger');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/:customPath', authMiddleware, async (req, res) => {
    try {
        const customPath = req.params.customPath;

        const userLink = await Link.findOne({ discordId: req.user.discordId, shortenedUrl: customPath });

        if (userLink) {
            return res.json({ isAvailable: false });
        }

        const websiteLink = await Link.findOne({ shortenedUrl: customPath });

        if (websiteLink) {
            return res.json({ isAvailable: false });
        }

        res.json({ isAvailable: true });
    } catch (error) {
        await logGeneralError(error, req.id, req.user ? req.user.id : 'Guest', 'Check Link Availability', req, res);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
