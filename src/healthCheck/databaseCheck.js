const mongoose = require('mongoose');

const mongoConnection = mongoose.createConnection('mongodb+srv://sniplinkwebsite:Rt8xkujnM7kfrBJd@snliplink.xmnfcq0.mongodb.net/', {});
async function checkDatabaseConnection(threshold = 5000, checks = 5) {
    try {
        let totalResponseTime = 0;

        for (let i = 0; i < checks; i++) {
            const startTime = Date.now();

            await mongoConnection.db.admin().ping();

            const endTime = Date.now();
            totalResponseTime += endTime - startTime;
        }

        const averageResponseTime = totalResponseTime / checks;
        const isHealthy = averageResponseTime <= threshold;

        if (isHealthy) {
            return 100 - Math.min((averageResponseTime / threshold) * 100, 100);
        } else {
            console.error('Database connection time exceeds threshold:', averageResponseTime);
            return -1;
        }
    } catch (error) {
        console.error('Error checking the database connection:', error);
        return -1;
    }
}

module.exports = { checkDatabaseConnection };