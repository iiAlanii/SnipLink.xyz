const mongoose = require('mongoose');

const LinkedUrlSchema = new mongoose.Schema({
    signedUrl: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('LinkedUrl', LinkedUrlSchema);