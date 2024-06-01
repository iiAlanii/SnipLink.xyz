const express = require('express');
const router = express.Router();
const { Link, Click } = require('../models');

const checkAuth = require('../checkAuth/auth');
const logGeneralError = require('../middleware/generalErrorLogger');
const allowedTesters = require('../utils/allowedTesters');

//TODO: Continue logging analytics data access
router.get('/:code', checkAuth, async (req, res) => {
    try {
        const link = await Link.findOne({ shortenedUrl: req.params.code, discordId: req.user.id }).populate('clicks');

        if (!link) {
            return res.status(404).render('error', { errorMessage: 'Link not found' });
        }
        link.clicks.sort((a, b) => b.date - a.date);

        const totalClicks = link.clicks.length;
        const uniqueClicks = new Set(link.clicks.map(click => click.ip)).size;
        const daysSinceCreated = (new Date() - new Date(link.dateCreated)) / (1000 * 60 * 60 * 24);
        const averageClicksPerDay = daysSinceCreated < 1 ? totalClicks : totalClicks / daysSinceCreated;

        const clicksOverTime = {};
        link.clicks.forEach((click) => {
            const date = click.date.toISOString().split('T')[0];
            if (clicksOverTime[date]) {
                clicksOverTime[date]++;
            } else {
                clicksOverTime[date] = 1;
            }
        });

        const topReferrers = await Click.getTopReferrers(link._id, 5);
        const topCountries = await Click.getTopCountries(link._id, 5);

        res.render('analytics', { link: link, user: req.user, topReferrers: topReferrers, topCountries: topCountries, clicksOverTime: clicksOverTime, totalClicks: totalClicks, uniqueClicks: uniqueClicks, averageClicksPerDay: averageClicksPerDay, allowedTesters: allowedTesters, req: req });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : undefined, 'Analytics', req, res);
        res.status(500).render('500');
    }
});

module.exports = router;
