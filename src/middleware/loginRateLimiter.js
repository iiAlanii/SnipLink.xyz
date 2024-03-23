const rateLimit = require("express-rate-limit");
const {  RateLimitLogger } = require('../utils/discordWebhookLogger');
const rateLimitLogger = new RateLimitLogger();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000000,
    handler: function(req, res) {
        rateLimitLogger.logRateLimit(req.ip, req.user ? req.user.id : 'Guest', req.id, 'Login');
        res.status(429).render('ratelimit');
    }
}); //TODO: loginlimiter and limiter are the same, need to create separate rate limiters for login and general

module.exports = loginLimiter;