const mongoose = require('mongoose');

const apiStatusSchema = new mongoose.Schema({
    isApiRunning: {
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

const ApiStatus = mongoose.model('ApiStatus', apiStatusSchema);

module.exports = ApiStatus;
