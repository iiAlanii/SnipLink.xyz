const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const checkAuth = require('../../checkAuth/auth');
const ApiLink = require('../../models/apiLink');
const Link = require('../../models/link');
const LinkedUrl = require('../../models/linkedUrl');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/link', authMiddleware, checkAuth, async (req, res) => {
    try {
        const user = req.user;

        const signedUrl = req.query.signedUrl;
        console.log('signedUrl:', signedUrl);

        if (!signedUrl) {
            return res.status(400).json({ error: 'No signedUrl provided' });
        }

        const decodedPayload = jwt.decode(signedUrl);

        const linkedUrlDoc = await LinkedUrl.findOne({ signedUrl });
        const apiLinkDoc = await ApiLink.findOne({ shortenedUrl: decodedPayload.shortCode });

        if (!linkedUrlDoc && !apiLinkDoc) {
            return res.redirect('/linkr/invalidLink');
        }

        if (linkedUrlDoc) {
            return res.redirect('/linkr/alreadyLinked');
        }

        if (!decodedPayload || !decodedPayload.shortCode || !decodedPayload.originalUrl) {
            return res.status(400).json({ error: 'Invalid signedUrl payload' });
        }

        if (!apiLinkDoc) {
            return res.status(404).json({ error: 'API link not found' });
        }

        const newLink = new Link({
            discordId: user.id,
            discordUsername: user.username,
            discordEmail: user.email,
            originalUrl: apiLinkDoc.originalUrl,
            shortenedUrl: apiLinkDoc.shortenedUrl,
            dateCreated: apiLinkDoc.createdAt,
            clicks: [],
            discordUserProfilePictureUrl: null,
            expiryDate: apiLinkDoc.expiryDate,
            metadataSource: 'API',
            linkPreview: {
                title: apiLinkDoc.title,
                description: apiLinkDoc.description,
                image: apiLinkDoc.image,
            },
            linkIdentifier: apiLinkDoc.apiLinkId,
        });

        await newLink.save();

        const newLinkedUrl = new LinkedUrl({ signedUrl });
        await newLinkedUrl.save();

        await apiLinkDoc.deleteOne();

        const { shortenedUrl } = apiLinkDoc;


        delete req.query.signedUrl;
        res.redirect(`/linkr/linkSuccess?shortenedUrl=${shortenedUrl}`);

    } catch (error) {
        console.error('Error handling link:', error);
        res.status(500).send('Internal server error');
    }
});



module.exports = router;


