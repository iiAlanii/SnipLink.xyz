const rateLimit = require('express-rate-limit');
const { GeneralErrorLogger, DiscordWebhookLogger, RateLimitLogger } = require('../utils/discordWebhookLogger');

const discordLogger = new DiscordWebhookLogger();
const rateLimitLogger = new RateLimitLogger();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    skipSuccessfulRequests: true,
    handler: function(req, res) {
        rateLimitLogger.logRateLimit(req.ip, req.user ? req.user.id : 'Guest', req.id, 'General');
        res.status(429).render('ratelimit');
    },
    skip: function(req) {
        return req.path === '/api/v1/shorten';
    },
    keyGenerator: function(req) {
        return req.ip;
    }
});

module.exports = limiter;
