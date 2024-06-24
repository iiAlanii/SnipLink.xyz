const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Link, Click, ApiLink } = require('../models/index');
const fs = require('fs').promises;
const path = require('path');
const logGeneralError = require('../middleware/generalErrorLogger');
const defaultImage = 'https://sniplink.xyz/images/sniplink-logo.png';
const ejs = require('ejs');
const geoip = require('geoip-lite');

const generateShortUUID = () => {
    return uuidv4().replace(/-/g, '');
};

router.get('/:shortCode', async (req, res, next) => {
    let { shortCode } = req.params;
    shortCode = String(shortCode);

    const userId = req.user ? req.user.id : 'Guest';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        let link = await Link.findOne({ shortenedUrl: shortCode });
        let isApiLink = false;

        if (!link) {
            link = await ApiLink.findOne({ shortenedUrl: shortCode });
            isApiLink = true;
        }

        if (link) {
            if (link.originalUrl === `https://sniplink.xyz/${shortCode}`) {
                return res.status(400).send('A shortened URL cannot point to itself.');
            }

            const clickId = generateShortUUID();
            const referrer = req.headers.referer || req.headers.Referrer || 'Direct';
            const clientIp = ipAddress;

            const geo = geoip.lookup(clientIp);
            const country = geo && geo.country ? geo.country : 'Unknown';
            const socialMedia = identifySocialMedia(referrer, userAgent);

            let title, description, image;
            if (link.linkPreview) {
                title = link.linkPreview.title || 'No title';
                description = link.linkPreview.description || 'No description';
                image = link.linkPreview.image || null;
            } else {
                title = link.title || 'No title';
                description = link.description || 'No description';
                image = link.image || defaultImage;
            }

            const loadingTemplate = await fs.readFile(path.join(__dirname, '..', 'views', 'loading.ejs'), 'utf8');
            const loadingContent = ejs.render(loadingTemplate, { link: link });

            const html = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>${title}</title>
        <meta name="referrer" content="origin">
        <meta property="og:url" content="${link.shortenedUrl}" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
        <meta name="description" content="${description}" />
        <meta name="author" content="SnipLink.xyz" />
        <script>
            if (window !== window.top) {
                console.log('Embedded page, no redirect');
            } else {
                setTimeout(function() {
                    window.location.href = '${link.originalUrl}';
                }, 1000);
            }
        </script>
    </head>
    <body>
           ${loadingContent}
    </body>
</html>
`;

            if (socialMedia === 'Bot') {
                res.setHeader('Content-Type', 'text/html');
                return res.send(html);
            }

            const newClick = new Click({
                linkId: link._id,
                ip: ipAddress,
                referrer: referrer,
                userAgent: userAgent,
                clickId: clickId,
                country: country,
                socialMedia: socialMedia,
            });

            await newClick.save();
            if (isApiLink) {
                link.clicks += 1;
                link.lastClickDate = new Date();
                link.clickDetails.push({
                    clickDate: new Date(),
                    referrer: referrer,
                    clientIp: clientIp,
                    country: country,
                    socialMedia: socialMedia,
                });
                await link.save();
            } else {
                link.clicks.push(newClick);
                link.lastClickDate = new Date();
                await link.save();
            }
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } else {
            next('route');
        }
    } catch (err) {
        const requestId = uuidv4();
        await logGeneralError(err, requestId, userId, 'Short Code Redirect', req, res);
        res.status(500).render('500');
    }
});

function identifySocialMedia(referrer, userAgent) {
    const socialMediaPatterns = [
        { name: 'Discord', patterns: ['discord.com', 'discord.gg'] },
        { name: 'Twitter', patterns: ['twitter.com'] },
        { name: 'Instagram', patterns: ['instagram.com'] },
        { name: 'Facebook', patterns: ['facebook.com', 'fb.com'] },
        { name: 'LinkedIn', patterns: ['linkedin.com'] },
        { name: 'Reddit', patterns: ['reddit.com'] },
        { name: 'Pinterest', patterns: ['pinterest.com'] },
        { name: 'Snapchat', patterns: ['snapchat.com'] },
        { name: 'TikTok', patterns: ['tiktok.com'] },
        { name: 'WhatsApp', patterns: ['whatsapp.com'] }
    ];

    const botUserAgents = [
        'Discordbot', 'Twitterbot', 'FacebookExternalHit', 'LinkedInBot', 'Pinterestbot',
        'SnapchatBot', 'Slackbot', 'WhatsApp', 'TelegramBot', 'Instagram', 'Googlebot',
        'Bingbot', 'Baiduspider', 'YandexBot', 'DuckDuckBot'
    ];

    if (botUserAgents.some(bot => userAgent.includes(bot))) {
        return 'Bot';
    }

    if (referrer) {
        try {
            const referrerUrl = new URL(referrer);
            for (const platform of socialMediaPatterns) {
                for (const pattern of platform.patterns) {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(referrerUrl.hostname)) {
                        return platform.name;
                    }
                }
            }
        } catch (err) {
            return 'Unknown';
        }
    }

    return 'Unknown';
}

module.exports = router;
