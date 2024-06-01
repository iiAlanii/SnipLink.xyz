const { GeneralErrorLogger, DiscordWebhookLogger } = require('../utils/discordWebhookLogger');
const discordLogger = new DiscordWebhookLogger();
const generalErrorLogger = new GeneralErrorLogger(discordLogger);
const { Ban } = require('../models/index');
async function banCheckMiddleware(req, res, next) {
    try {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];
        const discordId = req.user ? req.user.id : null;

        const fingerprint = req.session.fingerprint;

        const banRecord = await Ban.findOne({
            $or: [
                { ip: ip, userAgent: userAgent },
                { discordId: discordId },
                { fingerprint: fingerprint }
            ]
        });

        if (banRecord) {
            return res.status(403).render('ban', { reason: banRecord.reason });
        } else {
            next();
        }
    } catch (error) {
        generalErrorLogger.logError(error.message, error.stack, req.user ? req.user.id : 'Guest', req.id, 'banCheckMiddleware');
        return res.status(500).send('Error checking ban status.');
    }
}
module.exports = banCheckMiddleware;