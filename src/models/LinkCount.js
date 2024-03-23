const mongoose = require('mongoose');

const LinkCountSchema = new mongoose.Schema({
    count: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('LinkCount', LinkCountSchema);