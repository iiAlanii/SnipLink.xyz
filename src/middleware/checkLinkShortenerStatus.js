const { LinkShortenerStatus } = require('../models/index');
const { GeneralErrorLogger, DiscordWebhookLogger } = require('../utils/discordWebhookLogger');
const discordLogger = new DiscordWebhookLogger();
const generalErrorLogger = new GeneralErrorLogger(discordLogger);

async function checkLinkShortenerStatus(req, res, next) {
    try {
        const linkShortenerStatus = await LinkShortenerStatus.findOne();

        if (!linkShortenerStatus || !linkShortenerStatus.isShortenerActive) {
            return res.status(400).json({ error: 'Link Shortener is currently disabled.' });
        }

        next();
    } catch (error) {
        generalErrorLogger.logError(error.message, error.stack, req.user ? req.user.id : 'Guest', req.id, 'checkLinkShortenerStatus');
        res.status(500).json({ error: 'An error occurred while checking Link Shortener status.' });
    }
}

module.exports = checkLinkShortenerStatus;