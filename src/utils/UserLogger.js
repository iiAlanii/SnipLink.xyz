const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const fs = require('fs');
const path = require('path');

const customFormat = printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}]: ${message}`;
});

class UserLogger {
    constructor(discordId, username, email, pfp) {
        this.discordId = discordId;
        this.username = username;
        this.email = email;
        this.pfp = pfp;

        const userLogsDir = path.join(__dirname, '..', 'userLogs');
        if (!fs.existsSync(userLogsDir)) {
            fs.mkdirSync(userLogsDir);
        }

        this.logFilePath = path.join(userLogsDir, `${discordId}.log`);

        this.logger = createLogger({
            level: 'info',
            format: combine(
                timestamp(),
                customFormat
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: this.logFilePath }),
            ]
        });
    }

    log(page, action, actionDetails = {}) {
        let logEntry = {
            page: page,
            action: action,
            actionDetails: {
                ...actionDetails,
                date: actionDetails.date ? new Date(actionDetails.date).toLocaleString() : undefined,
            },
        };

        if (!UserLogger.loggedUsers.has(this.discordId)) {
            logEntry = {
                discordId: this.discordId,
                username: this.username,
                email: this.email,
                pfp: this.pfp,
                ...logEntry
            };

            UserLogger.loggedUsers.add(this.discordId);
        }

        this.logger.info(JSON.stringify(logEntry, null, 2));
    }
}

UserLogger.loggedUsers = new Set();

function initializeLogger() {
    return new Promise((resolve, reject) => {
        const userLogsDir = path.join(__dirname, '..', 'userLogs');
        if (!fs.existsSync(userLogsDir)) {
            fs.mkdir(userLogsDir, (err) => {
                if (err) {
                    console.error('Error creating userLogs directory:', err);
                    reject(err);
                } else {
                    console.log('userLogs directory created successfully');
                    resolve();
                }
            });
        } else {
            console.log('userLogs directory already exists');
            resolve();
        }
    });
}

module.exports = { UserLogger, initializeLogger };
