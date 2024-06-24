const mongoose = require('mongoose');
const { MaintenanceStatus, ApiLink } = require('../models/index');
let mongoConnection;

const connectDB = async () => {
    let mongoURI;
    if (process.env.ENVIRONMENT === 'development') {
        mongoURI = process.env.DEV_MONGO_URI; //MONGO_URI - original test db
    } else {
        mongoURI = process.env.PROD_MONGO_URI; //PROD_MONGO_URI
    }

    while (!mongoConnection) {
        try {
            mongoConnection = await mongoose.connect(mongoURI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 30000,
                maxPoolSize: 10,
            });

            mongoose.connection.on('connected', () => {
                console.log('[MONGO DATABASE] Mongoose successfully connected to MongoDB server');
            });

            mongoose.connection.on('disconnected', () => {
                console.log('[MONGO DATABASE] Mongoose disconnected from MongoDB server');
                mongoConnection = null;
            });

            await ApiLink.createIndexes();
            console.log('Indexes for ApiLink created');

            const existingStatus = await MaintenanceStatus.findOne();
            if (!existingStatus) {
                const initialStatus = new MaintenanceStatus({ isMaintenanceMode: false });
                await initialStatus.save();
            }

        } catch (err) {
            if (err.message.includes("isn't whitelisted")) {
                console.error('[MONGO DATABASE] Your IP address is not whitelisted. Please add current IP address to your MongoDB Atlas cluster\'s IP whitelist.');
            } else {
                console.error('[MONGO DATABASE] Error connecting to Database:', err);
            }
            console.log('Reconnecting in 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

process.on('SIGINT', cleanupAndExit.bind(null, 'MongoDB connection closed due to application termination'));
process.on('SIGTERM', cleanupAndExit.bind(null, 'MongoDB connection closed due to SIGTERM'));
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function cleanupAndExit(message) {
    console.log(message);

    if (mongoConnection) {
        mongoose.connection.close()
            .then(() => {
                console.log('[MONGO DATABASE] MongoDB connection closed');
                process.exit(0);
            })
            .catch((err) => {
                console.error('[MONGO DATABASE] Error closing MongoDB connection:', err);
                process.exit(1);
            });
    } else {
        process.exit(0);
    }
}

process.on('exit', (code) => {
    console.log(`[MONGO DATABASE] About to exit with code: ${code}`);
});

process.on('disconnect', () => {
    console.log('[MONGO DATABASE] Parent process has disconnected');
});

module.exports = connectDB;
