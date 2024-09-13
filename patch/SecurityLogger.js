const fs = require('fs');
const path = require('path');

const logsFolder = path.join(__dirname, 'logs');
if (!fs.existsSync(logsFolder)) {
    fs.mkdirSync(logsFolder);
}

const securityLogStream = fs.createWriteStream(path.join(logsFolder, 'security.log'), { flags: 'a' });

function getCurrentTimestamp() {
    const now = new Date();
    const options = {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
    };
    return now.toLocaleString('en-GB', options);
}

function logSecurityEvent(eventDetails) {
    if (eventDetails.includes('/admin') || eventDetails.includes('/api') || eventDetails.includes('/admin')) {
        const timestamp = getCurrentTimestamp();
        const logEntry = `${timestamp} - ${eventDetails}\n`;

        securityLogStream.write(logEntry, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to security log:', err);
            }
        });
    }
}

module.exports = logSecurityEvent;
