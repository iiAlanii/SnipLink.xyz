function restrictToServer(req, res, next) {
    const ip = req.connection.remoteAddress;
    const host = req.headers.host;

    const allowedIPs = ['::1', '127.0.0.1', '64.23.182.61'];
    const allowedHosts = ['localhost', 'sniplink.xyz', 'www.sniplink.xyz'];

    if (allowedIPs.includes(ip) || allowedHosts.includes(host)) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
}

module.exports = {
    restrictToServer,
};
