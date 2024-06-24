const rateLimit = require("express-rate-limit");
const {  RateLimitLogger } = require('../utils/discordWebhookLogger');
const rateLimitLogger = new RateLimitLogger();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: function(req, res) {
        rateLimitLogger.logRateLimit(req.ip, req.user ? req.user.id : 'Guest', req.id, 'Login');
        res.status(429).render('ratelimit');
    }
});

module.exports = loginLimiter;