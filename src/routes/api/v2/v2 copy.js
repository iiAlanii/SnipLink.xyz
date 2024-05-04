const express = require('express');
const router = express.Router();
const apiLinks = require('../../../models/apiLink');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const ApiStatus = require('../../../models/apiStatus');
const { logApiBusinessEvent } = require('../../../ServerLogging/BusinessLogicLogger');
const { DiscordWebhookLogger, GeneralErrorLogger } = require('../../../utils/discordWebhookLogger');
const { checkLinkExpiration } = require('../../../utils/linkExpirationChecker');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const discordLogger = new DiscordWebhookLogger();
const generalErrorLogger = new GeneralErrorLogger(discordLogger);
const logSecurityEvent = require('../../../ServerLogging/SecurityLogger');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const async = require('async');
const jwt = require('jsonwebtoken');
const defaultImage = 'https://sniplink.xyz/images/sniplink-banner.png';


const workerQueue = async.queue(async function(task, callback) {
    try {
        const newLink = new apiLinks({
            ...task,
            title: task.title || 'No Title',
            description: task.description || 'No Description',
            image: defaultImage || null,
        });

        await newLink.save();

        fetchAndParseHtml(task.originalUrl, newLink._id);
    } catch (err) {
        console.error('Error saving link to the database:', err);
        generalErrorLogger.logError(err.message, err.stack, 'Worker', null, 'API Shorten');
    }

    callback();
}, 100);

async function fetchAndParseHtml(url, linkId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log(`Failed to fetch URL: ${url}`);
            return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            console.log(`Invalid content type received for URL: ${url}`);
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const titleFromLink = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text();
        const descriptionFromLink = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || $('meta[name="description"]').attr('content');
        const imageFromLink = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

        const link = await apiLinks.findById(linkId);
        if (link) {
            link.title = titleFromLink;
            link.description = descriptionFromLink;
            link.image = imageFromLink || defaultImage;
            await link.save();
        }
    } catch (err) {
        console.error('Error fetching and parsing HTML:', err);
        generalErrorLogger.logError(err.message, err.stack, 'Worker', null, 'API Shorten');
    }
}

checkLinkExpiration().then(() => console.log('API Link expiration checker started'));

const { generateShortCode } = require('../../../utils/codeGenerator');
const {v4: uuidv4} = require("uuid");

const validApiKeys = [
    { key: 'b7225349-fe42-4c05-b83b-cb76a07ab888', identifier: 'r.mtdv.me' },
    { key: '0ec64d48-6a91-49a9-be13-71a6c1ac1944', identifier: 'HealthCheckIdentifier' },
];

function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['api-key'];
    const isHealthCheck = apiKey === '0ec64d48-6a91-49a9-be13-71a6c1ac1944';
    const clientIdentifier = req.headers['client-identifier'];
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const validKey = validApiKeys.find((entry) => entry.key === apiKey);

    if (!apiKey) {
        logSecurityEvent(`/api Unauthorized access attempt with no API key, client identifier: ${clientIdentifier}, IP: ${ip}, User-Agent: ${userAgent}`);
        return res.status(401).json({ error: 'Unauthorized. No API key provided.' });
    }

    if (!validKey) {
        logSecurityEvent(`/api Unauthorized access attempt with invalid API key: ${apiKey}, client identifier: ${clientIdentifier}, IP: ${ip}, User-Agent: ${userAgent}`);
        return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
    }

    if (isHealthCheck && validKey.identifier !== clientIdentifier) {
        logSecurityEvent(`/api Unauthorized access attempt with invalid client identifier: ${clientIdentifier} for health check, API key: ${apiKey}, IP: ${ip}, User-Agent: ${userAgent}`);
        return res.status(401).json({ error: 'Unauthorized. Invalid client identifier for health check.' });
    }

    if (validKey.identifier !== clientIdentifier) {
        logSecurityEvent(`/api Unauthorized access attempt with mismatched client identifier: ${clientIdentifier}, API key: ${apiKey}, IP: ${ip}, User-Agent: ${userAgent}`);
        return res.status(401).json({ error: 'Unauthorized. Client identifier does not match the one associated with the API key.' });
    }

    next();
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${day} ${month}, ${year}, ${hours}:${minutes}:${seconds}`;
}

router.post('/', authenticateApiKey, async (req, res) => {
    const apiStatus = await ApiStatus.findOne();

    if (!apiStatus) {
        return res.status(500).json({ error: 'Unable to retrieve API status.' });
    }

    if (apiStatus && !apiStatus.isApiRunning) {
        return res.status(503).json({ error: 'API is currently stopped. Please try again later.' });
    }

    const { longUrl, title, description, expiryDate } = req.body;
    if (!longUrl) {
        return res.status(500).json({ error: 'longUrl is required.' });
    }

    const currentUnixTimestamp = Math.floor(Date.now() / 1000);

    if (!expiryDate || isNaN(expiryDate) || expiryDate < 0 || !Number.isInteger(Number(expiryDate)) || expiryDate <= currentUnixTimestamp) {
        return res.status(400).json({ error: 'Invalid expiryDate. Please provide a valid Unix timestamp in the future.' });
    }

    if (!/^https?:\/\//i.test(longUrl)) {
        return res.status(400).json({ error: 'The URL must start with "http://" or "https://"' });
    }

    if (/[\s<>%@]/.test(longUrl)) {
        return res.status(400).json({ error: 'The URL must not contain any spaces, less than (<), greater than (>), percent (%), or at (@) characters.' });
    }

    if (title && title.length > 60) {
        return res.status(400).json({ error: 'The title must be 60 characters or less.' });
    }
    if (description && description.length > 250) {
        return res.status(400).json({ error: 'The description must be 250 characters or less.' });
    }

    if (!/^[a-zA-Z0-9\-_\. ,!`':?]+$/.test(title)) {
        return res.status(400).json({ error: 'The title can only include numbers, letters, hyphens, underscores, periods, spaces, commas, exclamation marks, backticks, apostrophes, colons, and question marks.' });
    }

    if (!/^[a-zA-Z0-9\-_\. ,!`':?]+$/.test(description)) {
        return res.status(400).json({ error: 'The description can only include numbers, letters, hyphens, underscores, periods, spaces, commas, exclamation marks, backticks, apostrophes, colons, and question marks.' });
    }

    const apiKey = req.headers['api-key'];
    const isHealthCheck = apiKey === '0ec64d48-6a91-49a9-be13-71a6c1ac1944';
    const clientIdentifier = req.headers['client-identifier'];

    if(!clientIdentifier) {
        logSecurityEvent(`/api Unauthorized access attempt with invalid client identifier.`);
        return res.status(401).json({ error: 'Unauthorized. Invalid client Identifier.' });    }
    if (!validUrl.isWebUri(longUrl)) {
        return res.status(400).json({ error: 'Invalid longUrl. Please provide a valid URL.' });
    }

    try {
        const { v4: uuidv4 } = require('uuid');

        const uniqueIdentifier = generateUniqueId();

        const requestId = uuidv4();
        const humanReadableExpiryDate = formatTimestamp(expiryDate * 1000);
        const apiLinkId = generateUniqueId();
        const isUnique = async (shortCode) => {
            const link = await apiLinks.findOne({ shortenedUrl: shortCode });
            return !link;
        };

        const shortCode = await generateShortCode(isUnique);
        const createdAt = Date.now();

        const signedUrlPayload = {
            identifier: uniqueIdentifier,
            shortCode: shortCode,
            originalUrl: longUrl,
        };
        const signedUrl = generateSignedUrl(signedUrlPayload);

        const newLink = {
            apiLinkId: generateUniqueId(),
            originalUrl: longUrl,
            shortenedUrl: shortCode,
            createdAt: createdAt,
            isHealthCheck: isHealthCheck,
            title: title,
            description: description,
            clientIdentifier: clientIdentifier,
            expiryDate: expiryDate,
            signedUrl: signedUrl,

        };

        workerQueue.push(newLink);

        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

        const debugMessage = {
            message: '[API] URL shortened successfully',
            linkId: apiLinkId,
            createdAt: formatTimestamp(createdAt),
            shortUrl: shortUrl,
            longUrl: longUrl,
            clientIdentifier: clientIdentifier,
            requestId: requestId,
            title: title,
            description: description,
            expiryDate: expiryDate,
        };

        const fields = [
            { name: 'Link ID', value: debugMessage.linkId.substring(0, 1024) },
            { name: 'Created At', value: debugMessage.createdAt.substring(0, 1024) },
            { name: 'Shortened URL', value: debugMessage.shortUrl.substring(0, 1024) },
            { name: 'Original URL', value: debugMessage.longUrl.substring(0, 1024) },
            { name: 'Client Identifier', value: debugMessage.clientIdentifier.substring(0, 1024) },
            { name: 'Title', value: (debugMessage.title || 'No title available').substring(0, 1024) },
            { name: 'Description', value: (debugMessage.description || 'No description available').substring(0, 1024) },
            { name: 'Expiry Date (Human Readable)', value: humanReadableExpiryDate.substring(0, 1024) },
            { name: 'Expiry Date (Unix Timestamp)', value: String(expiryDate) },
            { name: 'Request ID', value: requestId.substring(0, 1024) },

        ].slice(0, 25);
        await discordLogger.logMessage(debugMessage.message, debugMessage.linkId, debugMessage.createdAt, debugMessage.clientIdentifier, debugMessage.shortUrl, debugMessage.longUrl, fields);

        logApiBusinessEvent(
            debugMessage.message,
            debugMessage.linkId,
            debugMessage.shortUrl,
            debugMessage.longUrl,
            debugMessage.createdAt,
            requestId
        );


        res.setHeader('Content-Type', 'application/json');
        res.status(201).json({ shortUrl, longUrl, signedUrl, debug: debugMessage });
    } catch (err) {
        generalErrorLogger.logError(err.message, err.stack, req.user ? req.user.id : 'Guest', req.id, 'API Shorten');
        console.error('Error saving link to the database:', err);
        res.status(500).json({ error: 'An error occurred while shortening the URL.', errorCode: 'SERVER_ERROR' });
    }
});

function generateSignedUrl(payload) {
    const secretKey = 'your-secret-key';
    return jwt.sign(payload, secretKey);
}

function generateUniqueId() {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}`;
}

module.exports = router;
