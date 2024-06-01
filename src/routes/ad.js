const express = require('express');
const router = express.Router();
const { Link, Click} = require('../models');
const { v4: uuidv4 } = require("uuid");
//const logGeneralError = require('../middleware/generalErrorLogger'); //TODO Implement in ad.js
const { generateToken } = require('../utils/tokenUtils');

const token = generateToken();

router.get('/:shortCode', async (req, res, next) => {
    const { shortCode } = req.params;
    console.log('User Agent:', req.headers['user-agent']);
    const userId = req.user ? req.user.id : 'Guest';

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        let link = await Link.findOne({ shortenedUrl: shortCode });

        if (!link) {
            link = await apiLinks.findOne({ shortenedUrl: shortCode });
        }

        if (link) {
            const clickId = generateShortUUID();
            const referrer = req.headers.referer || req.headers.Referrer || 'Direct';
            console.log('Referrer for the ad.js:', referrer);
            console.log('User Agent:', req.headers['user-agent']);

            const socialMedia = identifySocialMedia(referrer, userAgent);
            if (socialMedia.endsWith('Bot')) {
                return res.render('linkPreview', { link });
            } else {
                const newClick = new Click({
                    linkId: link._id,
                    userId: userId,
                    ip: ipAddress,
                    referrer: referrer,
                    userAgent: userAgent,
                    clickId: clickId,
                    socialMedia: socialMedia,
                });

                await newClick.save();

                if (!link.clicks) {
                    link.clicks = [];
                }

                link.clicks.push(newClick);
                await link.save();

                if (socialMedia !== 'Unknown') {
                    return res.render('linkPreview', { link });
                } else {
                    res.render('ad', { link: link, clickId: clickId, token: token });
                }
            }
        } else {
            next('route');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

const generateShortUUID = () => {
    return uuidv4().replace(/-/g, '');
};
//TODO: Implement link preview in api
function identifySocialMedia(referrer, userAgent) {
    if (referrer) {
        if (referrer.includes('discord.com') || referrer.includes('discord.gg')) {
            return 'Discord';
        } else if (referrer.includes('twitter.com')) {
            return 'Twitter';
        } else if (referrer.includes('instagram.com')) {
            return 'Instagram';
        }
    }

    if (userAgent) {
        if (userAgent.includes('Discordbot')) {
            return 'DiscordBot';
        } else if (userAgent.includes('Twitterbot')) {
            return 'TwitterBot';
        } else if (userAgent.includes('Instagram')) {
            return 'InstagramBot';
        }
    }

    return 'Unknown';
}

module.exports = router;
