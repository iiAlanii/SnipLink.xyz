const { Link, ApiLink } = require('../models');

const expiryCheckerLogger = require('../ServerLogging/ExpiryCheckerLogger');
const { DiscordWebhookLogger, ApiLinkExpirationLogger, LinkExpirationLogger } = require('../utils/discordWebhookLogger');
const MessageQueue = require('../utils/MessageQueue');

const discordWebhookLogger = new DiscordWebhookLogger();
const apiLinkExpirationDiscordLogger = new ApiLinkExpirationLogger(discordWebhookLogger);
const linkExpirationDiscordLogger = new LinkExpirationLogger(discordWebhookLogger);


const CHECK_INTERVAL_SECONDS = 300;
const MESSAGE_QUEUE_INTERVAL = 1000;

const messageQueue = new MessageQueue(MESSAGE_QUEUE_INTERVAL);
messageQueue.start();


async function getMinExpiryDuration(currentUnixTimestampInSeconds) {
    const minExpiryDurationLink = await Link
        .find({ expiryDate: { $ne: null } })
        .sort({ expiryDate: 1 })
        .limit(1)
        .then(links => {
            if (links.length > 0) {
                return links[0].expiryDate - currentUnixTimestampInSeconds;
            }
            return Infinity;
        });

    const minExpiryDurationApiLink = await ApiLink
        .find({ expiryDate: { $ne: null } })
        .sort({ expiryDate: 1 })
        .limit(1)
        .then(links => {
            if (links.length > 0) {
                return links[0].expiryDate - currentUnixTimestampInSeconds;
            }
            return Infinity;
        });

    return Math.min(minExpiryDurationLink, minExpiryDurationApiLink);
}


const loggedLinks = new Set();

async function deleteExpiredLinks(currentUnixTimestampInSeconds) {
    const expiredLinksLink = await Link.find({ expiryDate: { $lte: currentUnixTimestampInSeconds } });
    const expiredLinksApiLink = await ApiLink.find({ expiryDate: { $lte: currentUnixTimestampInSeconds } });

    const expiredLinks = [...expiredLinksLink, ...expiredLinksApiLink];

    for (const link of expiredLinks) {
        const linkId = link._id;
        const shortUrl = link.shortenedUrl;
        const longUrl = link.originalUrl;
        const createdAt = link.dateCreated;
        const discordUsername = link.discordUsername;
        const discordId = link.discordId;
        const metadataSource = link.metadataSource;
        const title = link.linkPreview ? link.linkPreview.title : 'No Title';
        const originalExpiryDate = link.expiryDate;

        if (loggedLinks.has(shortUrl)) {
            continue;
        }

        loggedLinks.add(shortUrl);

        await link.constructor.findByIdAndDelete(linkId);

        expiryCheckerLogger.info(`
    Expired link deleted:
    linkId=${shortUrl},
    shortUrl=${shortUrl},
    longUrl=${longUrl},
    createdAt=${createdAt},
    eventName=Expiration Check
    originalExpiryDate=${originalExpiryDate}
`);

        if (link instanceof ApiLink) {
            apiLinkExpirationDiscordLogger.logApiLinkExpiration({
                originalUrl: longUrl,
                shortenedUrl: shortUrl,
                expiryDate: currentUnixTimestampInSeconds,
                originalExpiryDate: originalExpiryDate,
                title: title,
            });
        } else {
            linkExpirationDiscordLogger.logLinkExpiration({
                discordUsername: discordUsername,
                discordId: discordId,
                originalUrl: longUrl,
                shortenedUrl: shortUrl,
                expiryDate: currentUnixTimestampInSeconds,
                originalExpiryDate: originalExpiryDate,
                metadataSource: metadataSource,
                title: title,
            });

            messageQueue.enqueue({
                originalUrl: longUrl,
                shortenedUrl: shortUrl,
                expiryDate: currentUnixTimestampInSeconds,
                originalExpiryDate: originalExpiryDate,
                title: title,
            });
        }
    }
}
async function checkLinkExpiration() {
    try {
        const currentUnixTimestampInSeconds = Math.floor(Date.now() / 1000);
        const minExpiryDuration = await getMinExpiryDuration(currentUnixTimestampInSeconds);

        const expirationCheckInterval = isFinite(minExpiryDuration) ? Math.max(minExpiryDuration, CHECK_INTERVAL_SECONDS) : CHECK_INTERVAL_SECONDS;

        await deleteExpiredLinks(currentUnixTimestampInSeconds);

        expiryCheckerLogger.info('Link expiration check completed.', {
            'Current UNIX Timestamp': currentUnixTimestampInSeconds,
            'Next Check Interval': expirationCheckInterval
        });

        setTimeout(checkLinkExpiration, Math.min(expirationCheckInterval * 1000, 2147483647));
    } catch (error) {
        expiryCheckerLogger.error('Error checking link expiration:', error);

        setTimeout(checkLinkExpiration, CHECK_INTERVAL_SECONDS * 1000);
    }
}

checkLinkExpiration().then(() => expiryCheckerLogger.info('Link expiration checker started'));

module.exports = { checkLinkExpiration };
