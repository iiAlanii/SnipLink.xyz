const Link = require('../models/link');
const User = require('../models/user');

async function getTotalLinks() {
    try {
        const totalLinks = await Link.countDocuments();
        return totalLinks;
    } catch (error) {
        console.error('Error fetching total links:', error);
        throw error;
    }
}

async function getTotalUsers() {
    try {
        const totalUsers = await User.countDocuments();
        return totalUsers;
    } catch (error) {
        console.error('Error fetching total users:', error);
        throw error;
    }
}

module.exports = { getTotalLinks, getTotalUsers };
