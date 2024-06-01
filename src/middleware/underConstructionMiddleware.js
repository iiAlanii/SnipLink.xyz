const { underConstructionStatus } = require('../models/index');

async function underConstructionMiddleware(req, res, next) {
    const underConstruction = await underConstructionStatus.findOne({ isUnderConstruction: true });

    if (underConstruction) {
        if (req.originalUrl.startsWith('/api/')) {
            return next();
        }

        if (req.originalUrl === '/login' || req.originalUrl === '/auth/discord' || req.originalUrl === '/auth/discord/callback') {
            return next();
        } else if (req.user && req.user.id === '417237496007753738') {
            return next();
        } else {
            return res.render('underConstruction.ejs');
        }
    } else {
        return next();
    }
}

module.exports = underConstructionMiddleware;
