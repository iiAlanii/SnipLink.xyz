const Ban = require('../models/BanSchema');

const uIbanCheckMiddleware = async (req, res, next) => {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        const ipBan = await Ban.findOne({ ipAddress });
        if (ipBan) {
            return res.status(403).render('uIban');
        }

        const userAgentBan = await Ban.findOne({ userAgent });
        if (userAgentBan) {
            return res.status(403).render('uIban');
        }

        next();
    } catch (error) {
        console.error('Error checking ban status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = uIbanCheckMiddleware;
