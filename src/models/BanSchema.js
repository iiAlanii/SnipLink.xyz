const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        unique: true
    },
    userAgent: {
        type: String,
        required: true
    }
});

const Ban = mongoose.model('Ban', banSchema);

module.exports = Ban;
