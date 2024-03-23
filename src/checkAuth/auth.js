const logSecurityEvent = require('../ServerLogging/SecurityLogger');

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        logSecurityEvent(`Unauthorized access attempt to ${req.originalUrl} from IP ${req.ip}`);
        return res.redirect('/login');
    }
}

module.exports = checkAuth;