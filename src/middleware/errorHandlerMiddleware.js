const { createLogger, format, transports } = require('winston');
const { combine, printf } = format;
const { v4: uuidv4 } = require('uuid');

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
    transports: [new transports.File({ filename: 'logs/error.log', level: 'error' })]
});

const errorHandlerMiddleware = (err, req, res, next) => {
    err.message = err.message || 'An error occurred';
    const requestId = req.id || uuidv4();

    logger.log({
        level: 'error',
        message: `${err.message}`,
        method: req.method,
        url: req.originalUrl,
        status: err.status || 500,
        error: {
            message: err.message,
            stack: err.stack,
        },
        request: {
            headers: req.headers,
            body: req.body,
            params: req.params,
            requestId: requestId,
        },
    });
    generalErrorLogger.logError(err.message, err.stack, req.user ? req.user.id : 'Guest', requestId, 'errorHandlerMiddleware');

    next(err);
};

module.exports = errorHandlerMiddleware;