const fs = require('fs');
const path = require('path');

const logsFolder = path.join(__dirname, 'logs');
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder);
}

const businessLogStream = fs.createWriteStream(path.join(logsFolder, 'businessLogic.log'), { flags: 'a' });

function logBusinessEvent(eventDetails) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp: timestamp,
        details: eventDetails
    };

    const formattedLogEntry = JSON.stringify(logEntry, null, 2) + '\n\n';

    businessLogStream.write(formattedLogEntry, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to business logic log:', err);
        }
    });
}

function logApiBusinessEvent(message, linkId, shortUrl, longUrl, createdAt, requestId) {
    const details = {
        message: message,
        'Link ID': linkId,
        'Short URL': shortUrl,
        'Long URL': longUrl,
        'Created At': createdAt,
        'Request ID': requestId
    };

    logBusinessEvent(details);
}

function logInternalBusinessEvent(message, linkId, shortUrl, longUrl, createdAt) {
    logBusinessEvent(`[Internal] ${message} - Link ID: ${linkId} - Short URL: ${shortUrl} - Long URL: ${longUrl} - Created At: ${createdAt}`);
}

module.exports = { logBusinessEvent, logApiBusinessEvent, logInternalBusinessEvent };
