const express = require('express');
const router = express.Router();
const Link = require('../models/link');
const logGeneralError = require('../middleware/generalErrorLogger');
const checkAuth = require("../checkAuth/auth");
const isAdminMiddleware = require("../middleware/isAdminMiddleware");
const logSecurityEvent = require("../ServerLogging/SecurityLogger");
const allowedTesters = require('../utils/allowedTesters');
const checkAdminRole = (req, res, next) => {
    if (req.user.id === '417237496007753738') {
        next();
    } else {
        logSecurityEvent(`Unauthorized access attempt to admin route: ${req.originalUrl} from IP ${req.ip}`);
        res.redirect('/');
    }
};

router.get('/edit/:shortenedUrl', checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        const expectedDiscordId = '417237496007753738';
        const userDiscordId = req.user ? req.user.id : 'Guest';

        if (userDiscordId !== expectedDiscordId) {
            return res.status(404).render('404', { user: req.user });
        }

        const link = await Link.findOne({ shortenedUrl: req.params.shortenedUrl });

        if (!link) {
            return res.status(404).send('Link not found');
        }

        res.render('edit-link', { link, user: req.user, allowedTesters: allowedTesters });
    } catch (error) {
        await logGeneralError(error, req.id, userDiscordId, 'Edit Link', req, res);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
