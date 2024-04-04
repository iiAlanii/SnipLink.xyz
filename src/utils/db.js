const mongoose = require('mongoose');
const MaintenanceStatus = require('../models/maintenanceStatus');
const apiLink = require('../models/apiLink'); // Assuming this is the correct path to your apiLink model

let mongoConnection;

const connectDB = async () => {
    while (!mongoConnection) {
        try {
            mongoConnection = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 10000,
            });

            mongoose.connection.on('connected', () => {
                console.log('Mongoose successfully connected to MongoDB server');
            });

            mongoose.connection.on('disconnected', () => {
                console.log('Mongoose disconnected from MongoDB server');
                mongoConnection = null;
            });
            await apiLink.createIndexes();


            const existingStatus = await MaintenanceStatus.findOne();
            if (!existingStatus) {
                const initialStatus = new MaintenanceStatus({ isMaintenanceMode: false });
                await initialStatus.save();
            }
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
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
                console.log('MongoDB connection closed');
                process.exit(0);
            })
            .catch((err) => {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            });
    } else {
        process.exit(0);
    }
}

process.on('exit', (code) => {
    console.log(`About to exit with code: ${code}`);
});

process.on('disconnect', () => {
    console.log('Parent process has disconnected');
});

module.exports = connectDB;