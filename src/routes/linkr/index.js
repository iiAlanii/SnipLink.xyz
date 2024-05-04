//src/routes/linkr/index.js

const express = require('express');
const router = express.Router();
router.get('/connect', (req, res) => {
    const signedUrl = req.query.signedUrl;
    if (!signedUrl) {
        return res.status(404).render('404');
    }
    res.render('linkr/connectView', { signedUrl });
});

module.exports = router;