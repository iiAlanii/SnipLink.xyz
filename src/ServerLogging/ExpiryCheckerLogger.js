const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const expiryCheckerLogger = createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.File({ filename: path.join(__dirname, 'logs', 'expiryChecker.log'), level: 'info' }),
    ],
});

module.exports = expiryCheckerLogger;