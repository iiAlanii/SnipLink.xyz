const MaintenanceStatus = require('../models/maintenanceStatus');

async function checkMaintenanceMode(req, res, next) {
    const maintenanceStatus = await MaintenanceStatus.findOne({isMaintenanceMode: true});

    if (maintenanceStatus) {
        if (req.originalUrl === '/login' || req.originalUrl === '/auth/discord' || req.originalUrl === '/auth/discord/callback') {
            return next();
        } else if (req.user && req.user.id === '417237496007753738') {
            return next();
        } else {
            return res.render('maintenanceMode.ejs');
        }

    }
    else {
        return next();
    }
}

module.exports = checkMaintenanceMode;
