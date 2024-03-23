const mongoose = require('mongoose');

const newCollectionSchema = new mongoose.Schema({
    field1: {
        type: String,
        required: true,
    },
    field2: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const NewCollectionModel = mongoose.model('NewCollection', newCollectionSchema);

module.exports = NewCollectionModel;
