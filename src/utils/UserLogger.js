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

        this.consoleLogger = createLogger({
            level: 'info',
            format: combine(
                timestamp(),
                customFormat
            ),
            transports: [
                new transports.Console(),
            ]
        });

        this.fileLogger = createLogger({
            level: 'info',
            format: combine(
                timestamp(),
                customFormat
            ),
            transports: [
                new transports.File({ filename: this.logFilePath }),
            ]
        });

        if (!fs.existsSync(this.logFilePath)) {
            this.logUserInfo();
        }
    }

    logUserInfo() {
        const userInfo = {
            discordId: this.discordId,
            username: this.username,
            email: this.email,
            pfp: this.pfp,
        };
        this.fileLogger.info(`User Info: ${JSON.stringify(userInfo, null, 2)}`);
    }

    log(page, action, actionDetails = {}) {
        const excludedPages = ['/generateAuthKey', '/getCaptchaKey'];
        if (excludedPages.includes(page)) {
            return;
        }

        let logMessage = `${this.username} (${this.discordId}) visited ${page} at ${new Date().toLocaleString()}.`;

        if (action) {
            logMessage += ` Action: ${action}.`;
        }

        if (actionDetails.date) {
            logMessage += ` Details: ${JSON.stringify({
                ...actionDetails,
                date: new Date(actionDetails.date).toLocaleString(),
            }, null, 2)}`;
        } else {
            logMessage += ` Details: ${JSON.stringify(actionDetails, null, 2)}`;
        }

        this.consoleLogger.info(`${this.username} visited ${page} at ${new Date().toLocaleString()}.`);
        this.fileLogger.info(logMessage);
    }
}

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
