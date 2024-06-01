const express = require('express');
const router = express.Router();
const Click = require('../../models/click');

router.get('/:linkId', async (req, res) => {
    try {
        const linkId = req.params.linkId;
        console.log(`Fetching clicks by country for linkId: ${linkId}`); // Debug log
        const clicksByCountry = await Click.getTopCountries(linkId, 5);
        res.json(clicksByCountry);
    } catch (error) {
        console.error('Error fetching clicks by country:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
