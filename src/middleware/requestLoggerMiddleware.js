const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.File({ filename: 'logs/request-combined.log' }),
    ],
});

if (process.env.ENVIRONMENT !== 'production') {
    logger.add(new transports.Console({
        format: format.simple(),
    }));
}



const errorHandlerMiddleware = (err, req, res, next) => {
    err.message = err.message || 'An error occurred';

    const start = req._startTime;
    const end = new Date();
    const responseTime = end - start;

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
        },
        response: {
            responseTime: `${responseTime}ms`,
            requestId: req.id,
        },
    });

    res.status(err.status || 500).render('500', { error: err });
};

module.exports = errorHandlerMiddleware;