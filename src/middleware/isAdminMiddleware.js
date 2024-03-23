const UserModel = require('../models/user');
const logSecurityEvent = require('../ServerLogging/SecurityLogger');
const { GeneralErrorLogger, DiscordWebhookLogger } = require('../utils/discordWebhookLogger');
const discordLogger = new DiscordWebhookLogger();
const generalErrorLogger = new GeneralErrorLogger(discordLogger);

async function isAdminMiddleware(req, res, next) {
    const adminDiscordId = "417237496007753738";
    const { id: userDiscordId, username: userDiscordName } = req.user;
    const userIpAddress = req.ip;

    try {
        const admin = await UserModel.findOne({ discordId: adminDiscordId });

        if (admin && admin.role === 'Owner') {
            return next();
        } else {
            logSecurityEvent(`Unauthorized access attempt to admin route by user ${userDiscordName} with Discord ID ${userDiscordId} from IP ${userIpAddress}`);
            res.render('404');
        }
    } catch (error) {
        generalErrorLogger.logError(error.message, error.stack, req.user ? req.user.id : 'Guest', req.id, 'isAdminMiddleware');
        return res.status(500).render('500');
    }
}

module.exports = isAdminMiddleware;

