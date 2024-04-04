const mongoose = require('mongoose');

const apiLink2Schema = new mongoose.Schema({
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
});

const ApiLink2 = mongoose.model('ApiLink2', apiLink2Schema);

ApiLink2.createIndexes();

module.exports = ApiLink2;