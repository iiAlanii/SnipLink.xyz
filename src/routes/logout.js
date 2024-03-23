const express = require('express');
const router = express.Router();
const logGeneralError = require('../middleware/generalErrorLogger');

router.get('/', async (req, res) => {
    const userId = req.user ? req.user.id : 'Guest';

    try {
        req.session.destroy((err) => {
            if (err) {
                logGeneralError(err, req.id, userId, 'Logout', req, res);
                res.status(500).send('Server error');
            } else {
                res.render('logout.ejs');
            }
        });
    } catch (error) {
        await logGeneralError(error, req.id, userId, 'Logout', req, res);
        res.status(500).send('Server error');
    }
});

module.exports = router;
