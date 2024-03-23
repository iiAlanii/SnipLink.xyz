const mongoose = require('mongoose');

const linkShortenerStatusSchema = new mongoose.Schema({
    isShortenerActive: {
        type: Boolean,
        default: false,
    },
    toggleRequests: [
        {
            userId: String,
            timestamp: Date,
            action: String,
        },
    ],
});

const LinkShortenerStatus = mongoose.model('LinkShortenerStatus', linkShortenerStatusSchema);

module.exports = LinkShortenerStatus;
