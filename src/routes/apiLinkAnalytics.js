const express = require('express');
const router = express.Router();
const { ApiLink } = require('../models/index');
const allowedTesters = require("../utils/allowedTesters");

router.get('/:shortUrl/link-analytics', async (req, res) => {
    try {
        const shortUrl = req.params.shortUrl;
        const link = await ApiLink.findOne({ shortenedUrl: shortUrl });

        if (!link) {
            return res.status(404).render('404');
        }
        res.render('apiAnalyticsPage', { link: link, user: req.user, allowedTesters: allowedTesters });    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;