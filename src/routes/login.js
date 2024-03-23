const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/loginRateLimiter');
const middlewares = require("../middleware/serverRestrictions");
router.get('/', middlewares.restrictToServer, loginLimiter, (req, res) => {
    if (req.isAuthenticated()) {
        if (req.session.signedUrl) {
            return res.redirect(`/linkr/connect?signedUrl=${req.session.signedUrl}`);
        }
        return res.redirect('/dashboard');
    }
    res.render('login');
});

module.exports = router;
