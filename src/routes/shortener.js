const checkAuth = require('../checkAuth/auth');
const express = require('express');
const router = express.Router();
const { Link } = require('../models');
const logGeneralError = require('../middleware/generalErrorLogger');
const allowedTesters = require('../utils/allowedTesters');


router.get('/', checkAuth, async (req, res) => {
    try {
        const generalLinks = await Link.find({ discordId: { $exists: false } });
        const userLinks = await Link.find({ discordId: req.user.id }, 'originalUrl shortenedUrl');
        res.render('shortener', { generalLinks: generalLinks, userLinks: userLinks, user: req.user, allowedTesters: allowedTesters });
    } catch (err) {
        const userId = req.user ? req.user.id : 'Guest';
        await logGeneralError(err, null, userId, 'Shortener', req, res);
        res.status(500).render('500');
    }
});

module.exports = router;
