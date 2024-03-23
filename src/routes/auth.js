const express = require('express');
const passport = require('passport');
const router = express.Router();
const logGeneralError = require('../middleware/generalErrorLogger');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const logConcurrencyEvent = require('../ServerLogging/ConcurrencyLogger');
router.use(csrfProtection);

router.get('/discord', csrfProtection, (req, res, next) => {
    logConcurrencyEvent('DiscordAuthAccess', {
        action: 'access',
        userId: req.user ? req.user.id : 'Guest',
        timestamp: new Date().toISOString(),
    });

    passport.authenticate('discord')(req, res, next);
});

router.get('/discord/callback', csrfProtection, async (req, res, next) => {
    try {
        passport.authenticate('discord', (err, user) => {
            if (err) {
                logGeneralError(err, req.id, req.user ? req.user.id : 'Guest', 'Discord Callback', req, res);
                return res.redirect('/login?error=discord_auth_failed');
            }
            if (!user) {
                return res.redirect('/login?error=discord_auth_failed');
            }
            req.logIn(user, (err) => {
                if (err) {
                    logGeneralError(err, req.id, req.user ? req.user.id : 'Guest', 'Discord Callback', req, res);
                    return res.redirect('/login?error=discord_auth_failed');
                }
                return res.send('<script>window.close();</script>');
            });
        })(req, res, next);
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : 'Guest', 'Discord Callback', req, res);
        res.redirect('/login?error=discord_auth_failed');
    }
});

module.exports = router;
