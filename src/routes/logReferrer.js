const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const referrer = req.body.referrer;

    console.log(`Referrer: ${referrer}`);

    res.status(200).send();
});

module.exports = router;