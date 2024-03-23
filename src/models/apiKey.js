const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        default: 'API Key',
    },
    description: {
        type: String,
        default: 'An API Key',
    },
});


const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
