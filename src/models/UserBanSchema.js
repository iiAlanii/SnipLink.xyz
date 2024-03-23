const mongoose = require('mongoose');

const userBanSchema = new mongoose.Schema({
    discordId: String,
    ip: String,
    userAgent: String,
    fingerprint: String,
    reason: String,
    timestamp: { type: Date, default: Date.now },
});

const UserBan = mongoose.model('UserBan', userBanSchema);

module.exports = UserBan;