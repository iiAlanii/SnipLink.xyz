const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Link } = require('../models/index');

const checkAuth = require('../checkAuth/auth');
const { generateShortCode } = require('../utils/codeGenerator.js');
const checkLinkShortenerStatus = require('../middleware/checkLinkShortenerStatus');
const { DiscordWebhookLogger, LinkCreationLogger } = require('../utils/discordWebhookLogger');
const logGeneralError = require('../middleware/generalErrorLogger');

const discordLogger = new DiscordWebhookLogger();
const linkCreationLogger = new LinkCreationLogger(discordLogger);
const logConcurrencyEvent = require('../ServerLogging/ConcurrencyLogger');
const { v4: uuidv4 } = require('uuid');

const requestId = uuidv4();
const { encrypt } = require('../utils/encryptionUtils');
const { authMiddleware } = require('../middleware/authMiddleware');
const fetch = require('node-fetch');

const cheerio = require('cheerio');

router.post(
    '/',
    authMiddleware,
    checkAuth,
    checkLinkShortenerStatus,
    [
        body('longUrl').isURL().withMessage('Please provide a valid URL.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id: userId, username, email, avatar } = req.user;
            const { longUrl, title, description, customPath, expiryDate, metadataSource } = req.body;

            const isUnique = async (shortCode) => {
                const link = await Link.findOne({ shortenedUrl: shortCode });
                return !link;
            };

            const shortCode = customPath ? customPath.replace(/[^\w]/gi, '') : await generateShortCode(isUnique);

            const parsedExpiryDate = expiryDate === 'never' || expiryDate === null ? null : Math.floor(new Date(expiryDate).getTime() / 1000);
            const defaultImage = `${req.protocol}://${req.get('host')}/images/sniplink-logo.png`;


            const fetchMetadata = async (targetUrl, retryCount = 3) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => {
                    controller.abort();
                }, 5000);

                try {
                    const response = await fetch(targetUrl, { signal: controller.signal });
                    const html = await response.text();
                    const $ = cheerio.load(html);

                    const title = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text();
                    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content') || $('meta[name="description"]').attr('content');
                    const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

                    return { title, description, image };
                } catch (error) {
                    clearTimeout(timeout);
                    if (error.name === 'AbortError' && retryCount > 0) {
                        console.log('Fetch request timed out, retrying...');
                        return fetchMetadata(targetUrl, retryCount - 1);
                    } else {
                        console.log('Fetch request failed', error);
                        return { title: 'No Title', description: 'No Description', image: null };
                    }
                }
            }

            const newLink = new Link({
                discordId: userId,
                discordUsername: username,
                originalUrl: longUrl,
                shortenedUrl: shortCode,
                discordEmail: encrypt(email),
                discordUserProfilePictureUrl: `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`,
                expiryDate: parsedExpiryDate,
                metadataSource,
            });


            if (metadataSource === 'custom') {
                newLink.linkPreview = {
                    title,
                    description,
                };
            } else {
                const preview = await fetchMetadata(longUrl);
                newLink.linkPreview = {
                    title: preview.title || 'No Title',
                    description: preview.description || 'No Description',
                    image: preview.image || defaultImage,
                };
            }

            const { UserLogger } = require('../utils/UserLogger');

            if (req.user) {
                const discordId = String(req.user.id);
                const username = req.user.username;
                const email = req.user.email;
                const pfp = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`;

                const userLogger = new UserLogger(discordId, username, email, pfp);

                userLogger.log(req.originalUrl, 'Link shortened', {
                    date: new Date(),
                    metadata: newLink.metadata,
                    title: newLink.linkPreview.title,
                    description: newLink.linkPreview.description,
                    customUrl: newLink.shortenedUrl,
                });
            }

            await newLink.save();

            const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

            linkCreationLogger.logLinkCreation({
                discordUsername: username,
                discordId: userId,
                originalUrl: longUrl,
                shortenedUrl: shortUrl,
                expiryDate: parsedExpiryDate,
                metadataSource: metadataSource,
                title: newLink.linkPreview.title,
                description: newLink.linkPreview.description,
            });

            logConcurrencyEvent('Link Created', {
                userId: userId,
                username: username,
                shortUrl: shortUrl,
                originalUrl: longUrl,
                customUrl: newLink.shortenedUrl,
                title: newLink.linkPreview.title,
                description: newLink.linkPreview.description,
                expiryDate: parsedExpiryDate,
            });

            res.status(201).json({ shortUrl, longUrl, linkPreview: newLink.linkPreview });
        } catch (err) {
            const userId = req.user ? req.user.id : 'Guest';
            await logGeneralError(err, requestId, userId, 'Shorten URL', req, res);
            res.status(500).json({ error: 'An error occurred while shortening the URL.' });
        }
    }
);

module.exports = router;