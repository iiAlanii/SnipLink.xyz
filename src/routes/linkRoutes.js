const express = require('express');
const { Link } = require('../models');
const checkAuth = require('../checkAuth/auth');
const logConcurrencyEvent = require('../ServerLogging/ConcurrencyLogger');

const router = express.Router();
const allowedTesters = require('../utils/allowedTesters');
const { authMiddleware } = require('../middleware/authMiddleware');

router.delete('/delete-link/:id', authMiddleware, checkAuth, async (req, res) => {
    try {
        let linkIdToDelete = req.params.id;
        linkIdToDelete = String(linkIdToDelete);

        logConcurrencyEvent('LinkDeletion', {
            action: 'delete',
            linkId: linkIdToDelete,
            userId: req.user.id,
            timestamp: new Date().toISOString(),
        });

        const deletedLink = await Link.findByIdAndDelete(linkIdToDelete);

        if (!deletedLink) {
            return res.status(404).json({ error: 'Link not found' });
        }

        res.status(200).json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/manage-links', checkAuth, async (req, res) => {
    try {
        logConcurrencyEvent('ManageLinksAccess', {
            action: 'access',
            userId: req.user.id,
            timestamp: new Date().toISOString(),
        });

        const links = await Link.find({ discordId: req.user.id }).populate('clicks');

        if (!Array.isArray(links)) {
            return res.status(500).send('Internal Server Error: Links data is not an array');
        }

        links.forEach(link => {
            const uniqueIps = new Set(link.clicks.map(click => click.ip));
            link.uniqueClicks = uniqueIps.size;
        });

        res.render('manage-links', { user: req.user, links, allowedTesters: allowedTesters });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
