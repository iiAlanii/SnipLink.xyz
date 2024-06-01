const express = require('express');
const router = express.Router();
const { Link, User } = require('../models/index');

const checkAuth = require('../checkAuth/auth');
const logGeneralError = require('../middleware/generalErrorLogger');
const allowedTesters = require('../utils/allowedTesters');

router.get('/', checkAuth, async (req, res) => {
    const userId = req.user ? req.user.discordId : 'Guest';
    try {
        const discordId = req.user.id;

        const totalLinks = await Link.countDocuments({ discordId: discordId });
        const uniqueUsers = await User.countDocuments({});
        const recentLinks = await Link.find({ discordId: discordId }).sort({ dateCreated: -1 }).limit(5);
        const linkAnalytics = await Link.find({ discordId: discordId })
            .select('shortenedUrl clicks')
            .populate('clicks', 'date')
            .limit(50);

        const linkAnalyticsData = linkAnalytics.map((link) => {
            const numClicks = link.clicks.length;
            const lastClickDate = numClicks > 0 ? link.clicks[numClicks - 1].date : null;
            return {
                shortenedUrl: link.shortenedUrl,
                numClicks: numClicks,
                lastClickDate: lastClickDate,
            };
        });

        res.render('dashboard', {
            user: req.user,
            totalLinks: totalLinks,
            uniqueUsers: uniqueUsers,
            recentLinks: recentLinks,
            linkAnalytics: linkAnalyticsData,
            allowedTesters: allowedTesters,
        });

    } catch (err) {
        await logGeneralError(err, req.id, userId, 'Dashboard', req, res);
        res.status(500).render('500');
    }
});

module.exports = router;
