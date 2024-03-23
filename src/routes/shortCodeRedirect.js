const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Click = require('../models/click');
const Link = require('../models/link');
const fs = require('fs').promises;
const path = require('path');
const logGeneralError = require('../middleware/generalErrorLogger');


const generateShortUUID = () => {
    return uuidv4().replace(/-/g, '');
};

router.get('/:shortCode', async (req, res, next) => {
    const { shortCode } = req.params;
    console.log('User Agent:', req.headers['user-agent']);
    const userId = req.user ? req.user.id : 'Guest';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    

    try {
        const loadingContent = await fs.readFile(path.join(__dirname, '..', 'views', 'loading.ejs'), 'utf8');
        let link = await Link.findOne({ shortenedUrl: shortCode });

        if (!link) {
            link = await apiLinks.findOne({ shortenedUrl: shortCode });
        }

        if (link) {
            const clickId = generateShortUUID();
            const referrer = req.headers.referer || req.headers.Referrer || 'Direct';
            console.log('Referrer:', req.headers.referer);
            console.log('User Agent:', req.headers['user-agent']);

            const newClick = new Click({
                linkId: link._id,
                userId: userId,
                ip: ipAddress,
                referrer: referrer,
                userAgent: userAgent,
                clickId: clickId,
                socialMedia: identifySocialMedia(referrer),
            });

            await newClick.save();

            if (!link.clicks) {
                link.clicks = [];
            }

            link.clicks.push(newClick);
            await link.save();

            const title = link.linkPreview && link.linkPreview.title ? link.linkPreview.title : 'No title';
            const description = link.linkPreview && link.linkPreview.description ? link.linkPreview.description : 'No description';
            const image = link.linkPreview && link.linkPreview.image ? link.linkPreview.image : null;

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

function identifySocialMedia(referrer, utmSource) {
    if (utmSource) {
        if (utmSource.toLowerCase() === 'discord') {
            return 'Discord';
        }
    }

    if (referrer) {
        if (referrer.includes('discord.com') || referrer.includes('discord.gg')) {
            return 'Discord';
        } else if (referrer.includes('twitter.com')) {
            return 'Twitter';
        } else if (referrer.includes('instagram.com')) {
            return 'Instagram';
        }
    }

    return 'Unknown';
}

module.exports = router;
