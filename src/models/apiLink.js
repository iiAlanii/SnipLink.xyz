const mongoose = require('mongoose');

const clickDetailSchema = new mongoose.Schema({
    clickDate: {
        type: Date,
        default: Date.now,
    },
    referrer: {
        type: String,
        default: null,
    },
    clientIp: {
        type: String,
        default: null,
    },
    country: {
        type: String,
        default: null,
    },
    socialMedia: {
        type: String,
        default: null,
    }
});

const apilinkSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true
    },
    shortenedUrl: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    apiLinkId: {
        type: String,
        required: true,
        unique: true
    },
    isHealthCheck: {
        type: Boolean,
        default: false
    },
    clientIdentifier: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Number,
        default: null,
        required: true
    },
    title: {
        type: String,
        default: 'No Title'
    },
    description: {
        type: String,
        default: 'No Description'
    },
    image: {
        type: String,
        default: null
    },
    signedUrl: {
        type: String,
        default: null
    },
    lastClickDate: {
        type: Date,
        default: null
    },
    clickDetails: [clickDetailSchema]
});

const apiLink = mongoose.model('apiLink', apilinkSchema);

apiLink.createIndexes();

module.exports = apiLink;
