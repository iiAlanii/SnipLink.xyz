const { createLogger, format, transports } = require('winston');
const { combine, printf } = format;
const { GeneralErrorLogger, DiscordWebhookLogger } = require('../utils/discordWebhookLogger');
const discordLogger = new DiscordWebhookLogger();
const generalErrorLogger = new GeneralErrorLogger(discordLogger);

const customTimestamp = format((info, opts) => {
    if(opts.tz)
        info.timestamp = new Date().toLocaleString("en-US", {timeZone: opts.tz});
    return info;
});

const logFormat = printf(({ level, message, timestamp, method, url, status, error, request }) => {
    return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        method,
        url,
        status,
        error,
        request
    }, null, 2);
});

const logger = createLogger({
    format: combine(
        customTimestamp({tz: 'America/New_York'}),
        logFormat
    ),
    transports: [new transports.File({ filename: 'logs/general.log', level: 'error' })]
});

async function logGeneralError(err, requestId, userId, functionName, req, res) {
    if (res.statusCode !== 500) {
        const error = err instanceof Error ? err : new Error(err);
        const userAgent = req.headers['user-agent'];

        logger.log({
            level: 'error',
            message: `${error.message}`,
            error: {
                message: error.message,
                stack: error.stack,
            },
            request: {
                requestId: requestId,
                userAgent: userAgent,
            },
        });

        generalErrorLogger.logError(error.message, error.stack, req.user ? req.user.id : 'Guest', req.id, 'General Error');
    }
}


module.exports = logGeneralError;