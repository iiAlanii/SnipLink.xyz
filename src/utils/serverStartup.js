const { ServerStartupNotifier } = require('../utils/discordWebhookLogger');

function startServer() {
    const startupNotifier = new ServerStartupNotifier();

    startupNotifier.sendStartupMessage();

    const startupDelaySeconds = 5;
    setTimeout(() => {
        startupNotifier.sendRunningMessage();
    }, startupDelaySeconds * 1000);
}

module.exports = startServer;
