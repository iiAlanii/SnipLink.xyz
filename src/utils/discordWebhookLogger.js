const { v4: uuidv4 } = require('uuid');
const ApiStatus = require("../models/apiStatus");
const axios = require('axios');

class DiscordWebhookLogger {
    static webhookURL =  process.env.API_LINK_CREATION;

    constructor(webhookURL) {
        this.webhookURL = webhookURL || DiscordWebhookLogger.webhookURL;
    }


    async logMessage(title, linkId, createdAt, clientIdentifier, shortUrl, longUrl, fields, thumbnailUrl, color) {
        const axiosConfig = {
            timeout: 5000,
        };

        if (clientIdentifier === 'HealthCheckIdentifier') {
            return;
        }

        const requestIdField = fields && fields.find(field => field.name === 'Request ID');
        const requestId = requestIdField ? requestIdField.value : uuidv4();

        const embed = {
            title: title,
            thumbnail: {
                url: thumbnailUrl
            },
            fields: fields || [
                { name: 'Link ID', value: linkId },
                { name: 'Created At', value: createdAt },
                { name: 'Shortened URL', value: shortUrl },
                { name: 'Original URL', value: longUrl },
                { name: 'Client Identifier', value: clientIdentifier },
                { name: 'Request ID', value: requestId },
            ],
            color: color
        };

        try {
            return await axios.post(this.webhookURL, {
                embeds: [embed],
            });
        }  catch (error) {
            console.error('Error logging message to Discord:', error.message);

            if (error.response) {
                console.error('Discord API response data:', JSON.stringify(error.response.data, null, 2));
            }

            if (error.request) {
                console.error('Request data:', error.request);
            }

            if (error.response && error.response.data) {
                throw new Error(`Discord API error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                throw error;
            }
        }
    }

}

class RateLimitLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.RATELIMIT);
    }

    logRateLimit(ip, userId = 'Not available', requestId = 'Not available', source = 'General') {
        try {
            const title = `${source} Rate Limit Exceeded`;
            const fields = [
                { name: 'IP', value: ip },
                { name: 'User ID', value: userId },
                { name: 'Request ID', value: requestId },
            ];
            const color = 16711680;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
        } catch (error) {
            console.error(`Error logging ${source.toLowerCase()} rate limit:`, error);
        }
    }
}

class UserLoginLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.USERLOGIN);
    }

    logUserLogin(username, id, loginStatus, thumbnailUrl) {
        try {
            const title = 'User Login';
            const date = new Date();
            const formattedDate = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
            const formattedTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            const fields = [
                { name: 'Username', value: `${username}` },
                { name: 'User ID', value: `${id}` },
                { name: 'Date', value: formattedDate },
                { name: 'Time', value: formattedTime },
                { name: 'Login Status', value: loginStatus },
            ];
            const color = 3447003;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, thumbnailUrl, color);
        } catch (error) {
            console.error('Error logging user login:', error);
        }
    }
}

class LinkCreationLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.LINK_CREATION);
    }

    logLinkCreation(link) {
        try {
            const title = 'Link Creation';

            let expiryDateValue;
            if (link.expiryDate === null) {
                expiryDateValue = 'Never';
            } else {
                const timestampUnix = link.expiryDate;
                expiryDateValue = timestampUnix ? new Date(timestampUnix * 1000).toLocaleString() : 'Not Available';
            }

            const fields = [
                { name: 'Username', value: link.discordUsername, inline: true },
                { name: 'Discord ID', value: link.discordId, inline: true },
                { name: 'Original URL', value: link.originalUrl, inline: false },
                { name: 'Shortened URL', value: link.shortenedUrl, inline: false },
                { name: 'Expiry Date', value: expiryDateValue, inline: true },
                { name: 'Metadata Source', value: link.metadataSource, inline: true },
                { name: 'Title', value: link.title, inline: false },
                { name: 'Description', value: link.description, inline: false },
            ];

            const color = 3447003;
            this.discordWebhookLogger.logMessage(title, null, link.expiryDate, null, null, null, fields, link.discordUserProfilePictureUrl, color);
        } catch (error) {
            console.error('Error logging link creation:', error);
        }
    }
}

class ApiLinkExpirationLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.API_LINK_EXPIRATION);
    }

    logApiLinkExpiration(link) {
        try {
            const title = 'API Link Expiration';
            const timestampUnix = link.originalExpiryDate;
            const timestampHumanReadable = new Date(timestampUnix * 1000).toLocaleString();

            const fields = [
                { name: 'Original URL', value: link.originalUrl, inline: false },
                { name: 'Shortened URL', value: `https://sniplink.xyz/${link.shortenedUrl}`, inline: false },
                { name: 'Expiry Date (Unix)', value: link.originalExpiryDate, inline: true },
                { name: 'Expiry Date (Human Readable)', value: timestampHumanReadable, inline: true },
                { name: 'Description', value: `Link with ID \`${link.shortenedUrl}\` has expired and has been deleted.`, inline: false },
            ];

            const color = 3447003;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
        } catch (error) {
            console.error('Error logging API link expiration:', error);
            console.error('Link data:', link);
        }
    }
}

class LinkExpirationLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.LINK_EXPIRATION);
    }

    logLinkExpiration(link) {
        try {
            const title = 'Link Expiration';

            const timestampUnix = link.originalExpiryDate;
            const timestampHumanReadable = new Date(timestampUnix * 1000).toLocaleString();

            let fields = [
                { name: 'Original URL', value: link.originalUrl, inline: false },
                { name: 'Shortened URL', value: `https://sniplink.xyz/${link.shortenedUrl}`, inline: false },
                { name: 'Expiry Date (Unix)', value: link.originalExpiryDate, inline: true },
                { name: 'Expiry Date (Human Readable)', value: timestampHumanReadable, inline: true },
                { name: 'Metadata Source', value: link.metadataSource, inline: false },
                { name: 'Description', value: `Link with ID \`${link.shortenedUrl}\` has expired and has been deleted.`, inline: false },
            ];

            const color = 3447003;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, link.discordUserProfilePictureUrl, color);
        } catch (error) {
            console.error('Error logging link expiration:', error);
            console.error('Link data:', link);
        }
    }
}

class ServerErrorLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.SERVER_ERROR);
    }

    logError(errorMessage, errorStack, userId = 'Not available', requestId = 'Not available') {
        try {
            const errorLocation = errorStack.split('\n')[1] || 'Not available';

            const title = 'Server Error Occurred';
            const fields = [
                { name: 'Error Message', value: errorMessage },
                { name: 'Error Location', value: errorLocation },
                { name: 'Error Stack', value: errorStack.substring(0, 600) },
                { name: 'User ID', value: userId },
                { name: 'Request ID', value: requestId },
            ];
            const color = 3447003;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
        } catch (error) {
            console.error('Error logging server error:', error);
        }
    }
}

class GeneralErrorLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.GENERAL_ERROR);
    }

    logError(errorMessage, errorStack, userId = 'Not available', requestId = 'Not available', functionName = '') {
        try {
            const errorLocation = errorStack.split('\n')[1] || 'Not available';

            const title = `General Error Occurred - ${functionName}`;
            const fields = [
                { name: 'Error Message', value: errorMessage },
                { name: 'Error Location', value: errorLocation },
                { name: 'Error Stack', value: errorStack.substring(0, 600) },
                { name: 'User ID', value: userId },
                { name: 'Request ID', value: requestId },
            ];
            const color = 16711680;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
        } catch (error) {
            console.error('Error logging general error:', error);
        }
    }
}

class NotFoundLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.NOT_FOUND);
    }

    logNotFound(method, url, ip, userAgent, referer, route, sessionId, userId = 'Not available') {
        try {
            const title = '404 Not Found';
            let fields = [
                { name: 'Method', value: method },
                { name: 'URL', value: url },
                { name: 'IP', value: ip },
                { name: 'User Agent', value: userAgent },
                { name: 'Referer', value: referer },
                { name: 'Route', value: route },
                { name: 'Session ID', value: sessionId },
            ];

            if (userId !== 'Not available') {
                fields.push({ name: 'User ID', value: userId });
            }

            const color = 16711680;
            this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
        } catch (error) {
            console.error('Error logging 404 Not Found:', error);
        }
    }
}


class ServerStartupNotifier {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.SERVER_STARTUP_NOTIFIER);
    }

    async getServiceStatus() {
        const LinkShortenerStatus = require('../models/linkShortenerStatus');

        const apiStatus = await ApiStatus.findOne();
        const linkShortenerStatus = await LinkShortenerStatus.findOne();

        const dbStatus = { status: true, disabled: false, error: null };

        return [
            { name: 'API', status: apiStatus ? apiStatus.isApiRunning : false, disabled: false, error: null },
            { name: 'Link Shortener', status: linkShortenerStatus ? linkShortenerStatus.isShortenerActive : false, disabled: false, error: null },
            { name: 'Mongo Database', status: dbStatus.status, disabled: dbStatus.error ? true : false, error: dbStatus.error },
        ];
    }

    async sendStartupMessage() {
        const title = 'Server Startup';
        const services = await this.getServiceStatus();
        const fields = services.map(service => ({
            name: service.name,
            value: this.formatServiceStatus(service, true),
        }));
        const color = 3447003;
        await this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
    }

    async sendRunningMessage() {
        const title = 'Server Running';
        const services = await this.getServiceStatus();
        const fields = services.map(service => ({
            name: service.name,
            value: this.formatServiceStatus(service, false),
        }));
        const color = 3447003;
        await this.discordWebhookLogger.logMessage(title, null, null, null, null, null, fields, null, color);
    }

    formatServiceStatus(service, isStartup) {
        const statusPrefix = isStartup ? 'Starting' : service.status ? ':white_check_mark: Running' : ':x: Not running';
        const statusSuffix = service.disabled ? ' (Disabled)' : '';
        const errorSuffix = service.error ? ` (${service.error})` : '';

        return `${statusPrefix} ${service.name}${errorSuffix}${statusSuffix}`;
    }
}

class FeedbackLogger {
    constructor() {
        this.discordWebhookLogger = new DiscordWebhookLogger(process.env.FEEDBACK);
    }

    logFeedback(title, description, userId, username) {
        try {
            const feedbackTitle = `Feedback: ${title}`;
            const date = new Date();
            const formattedDate = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
            const formattedTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            const fields = [
                { name: 'Title', value: title, inline: true },
                { name: 'Description', value: description, inline: true },
                { name: 'User ID', value: userId, inline: true },
                { name: 'Username', value: username, inline: true },
                { name: 'Date', value: formattedDate, inline: true },
                { name: 'Time', value: formattedTime, inline: true }
            ];

            const color = 0x3498db;
            this.discordWebhookLogger.logMessage(feedbackTitle, null, null, null, null, null, fields, null, color).then(r => console.log(r)).catch(e => console.log(e));
        } catch (error) {
            console.error('Error logging feedback:', error);
        }
    }
}

module.exports = {
    DiscordWebhookLogger,
    UserLoginLogger,
    LinkCreationLogger,
    ServerErrorLogger,
    GeneralErrorLogger,
    NotFoundLogger,
    ApiLinkExpirationLogger,
    LinkExpirationLogger,
    RateLimitLogger,
    ServerStartupNotifier,
    FeedbackLogger
};