require('dotenv').config();

const allowedTesters = process.env.ALLOWED_TESTERS.split(',');

module.exports = allowedTesters;