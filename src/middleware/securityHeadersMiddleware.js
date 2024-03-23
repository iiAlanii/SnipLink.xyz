const helmet = require('helmet');

const securityHeadersMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'trusted-scripts.com', 'https://unpkg.com'],
            styleSrc: ["'self'", 'style-src', 'maxcdn.bootstrapcdn.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https://trusted-image-host.com'],
        },
    },
});

module.exports = securityHeadersMiddleware;
