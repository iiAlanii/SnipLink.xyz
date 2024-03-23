const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    profilePicture: { type: String },
    isBanned: { type: Boolean, default: false },
    userAgent: { type: String },
    role: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
