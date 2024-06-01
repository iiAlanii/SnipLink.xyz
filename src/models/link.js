const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    discordUsername: { type: String, required: true },
    discordEmail: { type: String, required: true },
    originalUrl: { type: String, required: true },
    shortenedUrl: { type: String, required: true, unique: true },
    dateCreated: { type: Date, default: Date.now },
    clicks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Click' }],
    discordUserProfilePictureUrl: { type: String },
    expiryDate: { type: Number, default: null },
    metadataSource: { type: String },
    linkPreview: {
        title: String,
        description: String,
        image: String,
    },
    linkIdentifier: { type: String },
});

linkSchema.methods.getClickCount = async function () {
    const Click = require('./click');
    return Click.countDocuments({linkId: this._id});
}

const Link = mongoose.model('Link', linkSchema);
module.exports = Link;
