const fs = require('fs');
const path = require('path');

const logsFolder = path.join(__dirname, 'logs');
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder);
}

const concurrencyLogStream = fs.createWriteStream(path.join(logsFolder, 'concurrency.log'), { flags: 'a' });


function logConcurrencyEvent(eventName, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        details: {
            ...details,
            originalUrl: details.originalUrl,
            customUrl: details.customUrl,
            title: details.title,
            description: details.description,
            expiryDate: details.expiryDate
        },
    };

    const logEntryString = JSON.stringify(logEntry, null, 2);

    concurrencyLogStream.write(`${logEntryString}\n`, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to concurrency log:', err);
        }
    });
}



module.exports = logConcurrencyEvent;
