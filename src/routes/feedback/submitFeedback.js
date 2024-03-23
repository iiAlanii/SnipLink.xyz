const express = require('express');
const router = express.Router();
const { FeedbackLogger, DiscordWebhookLogger } = require('../../utils/discordWebhookLogger');

const discordLogger = new DiscordWebhookLogger();
const feedbackLogger = new FeedbackLogger(discordLogger);

router.post('/', async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = '54545241357'
        const username = 'testuser' //TODO: Figure out what's going on here

        await feedbackLogger.logFeedback(title, description, userId, username);

        res.status(200).send('Feedback submitted successfully!');
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
