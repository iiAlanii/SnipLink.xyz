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

clickSchema.virtual('clickCount').get(function () {
    return this.clicks.length;
});

clickSchema.statics.getTopReferrers = async function (linkId, limit) {
    try {
        const topReferrers = await this.aggregate([
            { $match: { linkId: linkId, referrer: { $ne: null } } },
            {
                $group: {
                    _id: '$referrer',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'User',
                    localField: '_id',
                    foreignField: 'discordId',
                    as: 'referrerInfo',
                },
            },
            {
                $unwind: '$referrerInfo',
            },
            {
                $project: {
                    _id: 0,
                    referrer: '$referrerInfo.username',
                    discordId: '$referrerInfo.discordId',
                    profilePicture: '$referrerInfo.profilePicture',
                    email: '$referrerInfo.email',
                    count: 1,
                },
            },
        ]).exec();

        return topReferrers;
    } catch (error) {
        console.error('Error fetching top referrers:', error);
        throw error;
    }
};

clickSchema.statics.getTopCountries = function (linkId, limit) {
    return this.aggregate([
        { $match: { linkId: linkId, country: { $ne: null } } },
        {
            $group: {
                _id: '$country',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
    ]);
};

const Click = mongoose.model('Click', clickSchema);

module.exports = Click;
