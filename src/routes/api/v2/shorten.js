const express = require('express');
const router = express.Router();
let nanoid;
const mongoose = require('mongoose');

import('nanoid').then((module) => {
    nanoid = module.nanoid;
});

const apiLink2Schema = new mongoose.Schema({
    originalUrl: String,
    shortUrl: String,
    shortId: String,
    expiryDate: Number
});

const shortIdSchema = new mongoose.Schema({
    shortId: String
});

const ApiLink2 = mongoose.model('ApiLink2', apiLink2Schema);
const ShortId = mongoose.model('ShortId', shortIdSchema);

async function replenishShortIdPool() {
    const shortIdCount = await ShortId.countDocuments();
    const threshold = 1000; // Set your own threshold

    if (shortIdCount < threshold) {
        const newShortIds = Array(threshold - shortIdCount).fill().map(() => ({ shortId: nanoid(7) }));
        await ShortId.insertMany(newShortIds);
    }
}

setInterval(replenishShortIdPool, 60 * 60 * 1000);



router.post('/', async (req, res) => {
    const { longUrl, expiryDate } = req.body;

    // Take a shortId from the pool and delete it
    const shortIdDoc = await ShortId.findOneAndDelete();
    if (!shortIdDoc) {
        return res.status(500).json({ error: 'No available shortIds. Please try again later.' });
    }
    const shortId = shortIdDoc.shortId;

    const shortUrl = `${req.protocol}://${req.get('host')}/${shortId}`;

    const newLink = new ApiLink2({
        originalUrl: longUrl,
        shortUrl,
        shortId,
        expiryDate
    });

    // Use a transaction to save the new link
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await newLink.save({ session });
        await session.commitTransaction();
        res.status(201).json({ shortUrl, longUrl, expiryDate });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: 'An error occurred while saving the link.' });
    } finally {
        await session.endSession();
    }
});

module.exports = router;