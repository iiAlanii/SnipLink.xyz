const mongoose = require('mongoose');

const underConstructionSchema = new mongoose.Schema({
    isUnderConstruction: Boolean,

});

const underConstruction = mongoose.model('underConstruction', underConstructionSchema);

module.exports = underConstruction;