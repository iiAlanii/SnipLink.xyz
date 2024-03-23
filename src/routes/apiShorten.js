const express = require('express');
const router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');
const logGeneralError = require('../middleware/generalErrorLogger');


router.use(bodyParser.json());

router.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ error: 'Please provide a valid URL.' });
    }

    try {
        const response = await axios.post(`${req.protocol}://${req.get('host')}/api-shorten`, { longUrl });

        const shortUrl = response.data.shortUrl;
        res.status(200).json({ shortUrl });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : 'Guest', 'API Shorten URL', req, res);
        res.status(500).json({ error: 'An error occurred while shortening the URL.' });
    }
});

module.exports = router;
