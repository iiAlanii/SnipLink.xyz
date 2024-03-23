const mongoose = require('mongoose');

const linkInfoSchema = new mongoose.Schema({
    linkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Link',
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    referrer: {
        type: String,
        default: '',
    },
    userAgent: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const LinkInfo = mongoose.model('LinkInfo', linkInfoSchema);

module.exports = LinkInfo;
