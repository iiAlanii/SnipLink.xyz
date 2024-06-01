const express = require('express');
const router = express.Router();
const Click = require('../../models/click');

router.get('/:linkId', async (req, res) => {
    try {
        const linkId = req.params.linkId;
        const topReferrers = await Click.getTopReferrers(linkId, 5);
        res.json(topReferrers);
    } catch (error) {
        console.error('Error fetching top referrers:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
