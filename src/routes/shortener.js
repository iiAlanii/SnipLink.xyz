const express = require('express');
const router = express.Router();
const { Link } = require('../models');
const checkAuth = require('../checkAuth/auth');
const logGeneralError = require('../middleware/generalErrorLogger');
const allowedTesters = require('../utils/allowedTesters');

router.get('/', checkAuth, async (req, res) => {
    try {
        console.log('User ID:', req.user.id);

        const generalLinks = await Link.find({ discordId: { $exists: false } });
        const userLinks = await Link.find({ discordId: req.user.id }, 'originalUrl shortenedUrl');

        console.log('General Links:', generalLinks.length);
        console.log('User Links:', userLinks.length);

        res.render('shortener', { generalLinks, userLinks, user: req.user, allowedTesters });
    } catch (err) {
        const userId = req.user ? req.user.id : 'Guest';
        await logGeneralError(err, null, userId, 'Shortener', req, res);
        console.error('Error rendering shortener page:', err);
        res.status(500).render('500');
    }
});

module.exports = router;
