const express = require('express');
const router = express.Router();
const { Link } = require('../models');

const generatePreviewHtml = require('./generatePreviewHtml');

router.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    const link = await Link.findOne({ shortenedUrl: shortCode });

    if (link) {
        const title = link.linkPreview && link.linkPreview.title ? link.linkPreview.title : 'No title';
        const description = link.linkPreview && link.linkPreview.description ? link.linkPreview.description : 'No description';
        const image = link.linkPreview && link.linkPreview.image ? link.linkPreview.image : null;
        const loadingContent = '';

        const html = generatePreviewHtml(title, link, description, image, loadingContent);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } else {
        res.status(404).send('Link not found');
    }
});

module.exports = router;