const express = require('express');
const router = express.Router();
const apiLink = require('../models/apiLink');

router.get('/:shortUrl/link-analytics', async (req, res) => {
    try {
        const shortUrl = req.params.shortUrl;
        const link = await apiLink.findOne({ shortenedUrl: shortUrl });

        if (!link) {
            return res.status(404).render('404');
        }
        res.render('apiAnalyticsPage', { link: link, user: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;