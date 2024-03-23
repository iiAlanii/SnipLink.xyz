const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const logsFolder = path.join(__dirname, 'logs');
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder);
}

const accessLogStream = fs.createWriteStream(path.join(logsFolder, 'access.log'), { flags: 'a' });

const accessLoggerMiddleware = morgan('combined', { stream: accessLogStream });

module.exports = accessLoggerMiddleware;
