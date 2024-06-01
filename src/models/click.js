const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
    ip: { type: String, required: true },
    referrer: { type: String },
    userAgent: { type: String },
    date: { type: Date, default: Date.now },
    clickId: { type: String, required: true },
    country: { type: String },
    socialMedia: { type: String },
});

clickSchema.statics.getTopReferrers = async function (linkId, limit) {
    return this.aggregate([
        { $match: { linkId: new mongoose.Types.ObjectId(linkId) } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);
};

clickSchema.statics.getTopCountries = async function (linkId, limit) {
    return this.aggregate([
        { $match: { linkId: new mongoose.Types.ObjectId(linkId), country: { $ne: null } } },
        {
            $group: {
                _id: '$country',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);
};

const Click = mongoose.model('Click', clickSchema);
module.exports = Click;
