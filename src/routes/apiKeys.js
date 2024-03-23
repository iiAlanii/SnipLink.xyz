const express = require('express');
const router = express.Router();
const ApiKey = require('../models/apiKey');
const logGeneralError = require('../middleware/generalErrorLogger');
const checkAuth = require("../checkAuth/auth");
const isAdminMiddleware = require("../middleware/isAdminMiddleware");
const logSecurityEvent = require("../ServerLogging/SecurityLogger");
const { authMiddleware } = require("../middleware/authMiddleware");
const checkAdminRole = (req, res, next) => {
    if (req.user.id === '417237496007753738') {
        next();
    } else {
        logSecurityEvent(`Unauthorized access attempt to admin route: ${req.originalUrl} from IP ${req.ip}`);
        res.redirect('/');
    }
};

router.post('/add', checkAuth, authMiddleware, checkAdminRole, isAdminMiddleware,  async (req, res) => {
    const { apiKey } = req.body;

    try {
        const existingKey = await ApiKey.findOne({ key: apiKey });
        if (existingKey) {
            return res.status(400).json({ error: 'API key already exists.' });
        }

        const newApiKey = new ApiKey({ key: apiKey });
        await newApiKey.save();

        res.status(201).json({ message: 'API key added successfully.' });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : 'Guest', 'Add API Key', req, res);
        res.status(500).json({ error: 'An error occurred while adding the API key.' });
    }
});

router.get('/', checkAuth, authMiddleware, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const userId = req.user ? req.user.id : 'Guest';

    try {
        const apiKeys = await ApiKey.find();
        res.status(200).json({ apiKeys });
    } catch (err) {
        await logGeneralError(err, req.id, userId, 'Get API Keys', req, res);
        res.status(500).json({ error: 'An error occurred while fetching the API keys.' });
    }
});
router.delete('/:id', checkAuth,  authMiddleware, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const { key } = req.params;

    try {
        await ApiKey.findOneAndDelete({ key });
        res.status(200).json({ message: 'API key deleted successfully.' });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : 'Guest', 'Delete API Key', req, res);
        res.status(500).json({ error: 'An error occurred while deleting the API key.' });
    }
});

module.exports = router;
