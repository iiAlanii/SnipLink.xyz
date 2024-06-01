const express = require('express');
const router = express.Router();
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require("uuid");
const { Click, Ban } = require('../models/index');

const checkAuth = require('../checkAuth/auth');
const isAdminMiddleware = require('../middleware/isAdminMiddleware');
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');

const { Link, User, ApiKey, apiStatus, ApiStatus, MaintenanceStatus } = require('../models');


const { checkApiAvailability } = require('../healthCheck/apiCheck');
const { checkDatabaseConnection } = require('../healthCheck/databaseCheck');
const { checkServerLoad } = require('../healthCheck/serverCheck');

const logSecurityEvent = require('../ServerLogging/SecurityLogger');
const allowedTesters = require('../utils/allowedTesters');

const logGeneralError = require('../middleware/generalErrorLogger');
const crypto = require("crypto");


const checkAdminRole = (req, res, next) => {
    if (req.user.id === '417237496007753738') {
        next();
    } else {
        logSecurityEvent(`Unauthorized access attempt to admin route: ${req.originalUrl} from IP ${req.ip}`);
        res.render('404');
    }
};

router.post('/toggle-api', authMiddleware, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        let apiStatus = await ApiStatus.findOne();

        if (!apiStatus) {
            apiStatus = new ApiStatus({
                isApiRunning: false,
                toggleRequests: [],
            });
        }

        apiStatus.isApiRunning = !apiStatus.isApiRunning;

        const action = apiStatus.isApiRunning ? 'started' : 'stopped';
        apiStatus.toggleRequests.push({
            userId: req.user._id,
            timestamp: new Date(),
            action: action,
        });

        await apiStatus.save();

        res.status(200).json({ message: `${action} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/maintenance-toggle', authMiddleware, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        const currentStatus = await MaintenanceStatus.findOne();
        currentStatus.isMaintenanceMode = !currentStatus.isMaintenanceMode;
        await currentStatus.save();
        res.status(200).json({ message: 'Maintenance mode toggled successfully' });
    } catch (error) {
        console.error("Error toggling maintenance mode:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/ban', checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const { discordId, ip, userAgent, reason, fingerprint } = req.body;
    try {
        const newBan = new UserBan({
            discordId: discordId,
            ip: ip,
            userAgent: userAgent,
            fingerprint: fingerprint,
            reason: reason,
        });

        await newBan.save();

        res.status(200).send('User banned successfully.');
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).send('Error banning user.');
    }
});

router.post('/toggle-shortener', checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const action = req.body.action;

    try {
        let shortenerStatus = await apiStatus.findOne();

        if (!shortenerStatus) {
            shortenerStatus = new apiStatus({
                isShortenerActive: false,
                toggleRequests: [],
            });
        }

        shortenerStatus.isShortenerActive = !shortenerStatus.isShortenerActive;

        const status = shortenerStatus.isShortenerActive ? 'activated' : 'deactivated';
        shortenerStatus.toggleRequests.push({
            userId: req.user._id,
            timestamp: new Date(),
            action: action,
        });

        await shortenerStatus.save();

        res.status(200).json({ message: `Link Shortener ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/health', checkAuth, checkAdminRole, isAdminMiddleware, async (req, res, next) => {
    try {
        const apiHealth = await checkApiAvailability();
        const databaseHealth = await checkDatabaseConnection();
        const serverHealth = await checkServerLoad();


        const overallHealth = (apiHealth + databaseHealth + (isNaN(parseFloat(serverHealth)) ? 0 : parseFloat(serverHealth))) / 3;

        res.render('admin/health', {
            user: req.user,
            allowedTesters: allowedTesters,
            overallHealth: `${overallHealth.toFixed(2)}%`,
            details: {
                api: typeof apiHealth === 'number' ? `${apiHealth.toFixed(2)}%` : 'N/A',
                database: typeof databaseHealth === 'number' ? `${databaseHealth.toFixed(2)}%` : 'N/A',
                server: isNaN(parseFloat(serverHealth)) ? 'N/A' : `${parseFloat(serverHealth).toFixed(2)}%`,
            },
        });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : undefined, 'Admin Health', req, res, next);
    }
});

router.get('/:page', checkAuth, checkAdminRole, isAdminMiddleware, async (req, res, next) => {
    if (req.user.id === '417237496007753738') {
        let { page } = req.params;
        page = String(page);
        const allowedPages = ['dashboard', 'api', 'general-settings', 'link-analytics', 'link-management', 'user-management'];

        if (!allowedPages.includes(page)) {
            next('route');
            return;
        }

        try {
            if (page === 'dashboard') {
                try {
                    const links = await Link.find({ discordId: req.user.id });
                    res.render(`admin/${page}`, { user: req.user, links, allowedTesters: allowedTesters });
                } catch (error) {
                  await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin Dashboard', req, res, next);
                }
            }

            if (page === 'general-settings') {
                try {
                    res.render(`admin/${page}`, { user: req.user,  allowedTesters: allowedTesters });
                } catch (error) {
                   await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin General-settings', req, res, next);
                }
            }
            if (page === 'api') {
                try {
                    const apiKeys = await ApiKey.find();
                    res.render(`admin/${page}`, { user: req.user, apiKeys, allowedTesters: allowedTesters });
                } catch (error) {
                   await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin Api', req, res, next);
                }
            } else if (page === 'user-management') {
                try {
                    const users = await User.find();
                    res.render(`admin/${page}`, { user: req.user, users: users, allowedTesters: allowedTesters });
                } catch (error) {
                   await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin User-management', req, res, next);
                }
            }
        } catch (error) {
            await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Error during admin operation', req, res, next);
        }
    } else {
        try {
            res.redirect('404');
        } catch (error) {
            await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin redirect Home', req, res, next);
        }
    }
});


router.post('/admin/user-management/:id/ban', authMiddleware, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        const { discordId } = req.params;
        const { banCriteria, reason } = req.body;

        if (!banCriteria.ip && !banCriteria.userAgent && !banCriteria.discordId) {
            return res.status(400).json({ error: 'Please select at least one ban criteria.' });
        }

        const userBan = new UserBan({ discordId, ...banCriteria, reason });
        await userBan.save();

        res.status(200).json({ message: 'User has been banned successfully.' });
    } catch (error) {
        await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin user-management - Ban', req, res);
        res.status(500).json({ error: 'Failed to ban the user.' });
    }
});


router.delete('/user-management/:id/delete', authMiddleware, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const discordId = req.params.id;

    try {
        await User.findOneAndDelete({ discordId: discordId });
        await Link.deleteMany({ discordId: discordId });
        res.sendStatus(200);
    } catch (error) {
        await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin user-management - delete', req, res);
        res.status(500).send('Failed to delete user and links.');
    }
});


router.get('/user-management/:id', checkAuth, checkAdminRole, isAdminMiddleware,  async (req, res) => {
    if (req.user.id === '417237496007753738') {
        try {
            const discordId = req.params.id;
            const user = await User.findOne({ discordId: discordId });

            if (!user) {
                res.sendStatus(404);
                return;
            }

            const ip = req.ip;
            const userAgent = req.headers['user-agent'];

            res.render('admin/user-details', { user, ip, userAgent, allowedTesters: allowedTesters });

        } catch (err) {
            await logGeneralError(err, req.id, req.user ? req.user.id : undefined, 'Admin user-management - get user', req, res);
            res.status(500).render('500');
        }
    } else {
        try {
            res.redirect('/');
        } catch (error) {
            await logGeneralError(error, req.id, req.user ? req.user.id : undefined, 'Admin redirect Home', req, res);
        }
    }
});

const algorithm = process.env.ALGORITHM;
const key = Buffer.from(process.env.KEY, 'hex');
let iv = Buffer.from(process.env.IV, 'hex');

if (iv.length !== 16) {
    console.error('IV is not 16 bytes long. Generating a new IV...');
    iv = crypto.randomBytes(16);
}

async function getSearchResults(searchQuery) {
    searchQuery = searchQuery.toString();
    return await Link.find({shortenedUrl: {$regex: searchQuery, $options: 'i'}});
}

const decryptEmails = (results) => {
    results.forEach(result => {
        try {
            const parts = result.discordEmail.split(':');
            const iv = Buffer.from(parts.shift(), 'hex');
            const encryptedText = Buffer.from(parts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
            result.discordEmail = decrypted.toString();
        } catch (error) {
            console.error('Error during decryption:', error);
            result.discordEmail = 'Decryption Error';
        }
    });
    return results;
};

router.post('/search', checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        const { searchQuery } = req.body;
        const results = await getSearchResults(searchQuery);
        decryptEmails(results);

        res.json({ links: results });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : undefined, 'Admin Search', req, res);
        res.status(500).json({ error: 'An error occurred while searching for links.' });
    }
});

router.delete('/deleteLink/:linkId', authMiddleware, checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        const linkId = req.params.linkId;
        const linkToDelete = await Link.findOne({ _id: linkId, discordId: req.user.id });

        if (!linkToDelete) {
            res.status(403).json({ error: 'Link not found or unauthorized to delete.' });
            return;
        }

        await Link.deleteOne({ _id: linkId });
        res.json({ message: 'Link deleted successfully.' });
    } catch (err) {
        await logGeneralError(err, req.id, req.user ? req.user.id : undefined, 'Admin deleteLink', req, res);
        res.status(500).json({ error: 'An error occurred while deleting the link.' });
    }
});
router.use((req, res, next) => {
    let buffer = new Array(16);
    req.id = uuidv4(null, buffer, 0);
    next();
});


router.get('/user-management/:id/links', authMiddleware, async (req, res) => {
    try {
        const discordId = req.params.id;
        const links = await Link.find({ discordId: discordId });

        res.json(links);
    } catch (err) {
        generalErrorLogger.logError(err.message, err.stack, req.user ? req.user.id : undefined, req.id, 'Admin user-management - get links');
        res.status(500).json({ error: 'Error fetching links' });
    }
});


router.get('/user-management/:id/export', authMiddleware, async (req, res) => {
    try {
        const discordId = req.params.id;
        const exportingUser = req.user;
        console.log(`Exporting user data for user with discordId: ${discordId} by ${exportingUser.username}`);

        const user = await User.findOne({ discordId: discordId });

        if (!user) {
            console.log('User not found with discordId:', discordId);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const linkData = await Link.find({ discordId: discordId }).populate('clicks');
        const userData = {
            username: user.username,
            ip: user.ip,
            email: user.email,
            originalEmail: user.originalEmail,
            discordId: user.discordId,
            profilePicture: user.profilePicture,
            links: linkData.map(link => ({
                originalUrl: link.originalUrl,
                shortenedUrl: link.shortenedUrl,
                dateCreated: link.dateCreated,
                expiryDate: link.expiryDate,
                metadataSource: link.metadataSource,
                linkPreview: {
                    title: link.linkPreview.title,
                    description: link.linkPreview.description,
                    image: link.linkPreview.image,
                },
                clicks: link.clicks.map(click => ({
                    userAgent: click.userAgent,
                    date: click.date,
                })),
            })),
        };

        const zipFilePath = `user_data_${discordId}.zip`;
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', async () => {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');

            res.download(zipFilePath, async (err) => {
                if (err) {
                    await generalErrorLogger.logError(err.message, err.stack, req.user ? req.user.id : undefined, req.id, 'Admin user-management - export download');
                    throw err;
                }
                fs.unlinkSync(zipFilePath);
            });
        });

        archive.pipe(output);
        archive.append(JSON.stringify(userData, null, 2), { name: 'user_data.json' });
        archive.append(fs.createReadStream(path.join(__dirname, '..', 'userLogs', `${discordId}.log`)), { name: 'user_logs.log' });
        await archive.finalize();

    } catch (err) {
        console.log('Error exporting user data:', err);
        res.status(500).json({ error: 'Error exporting user data' });
    }
});

router.get('/click-details/:clickId', authMiddleware, checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const { clickId } = req.params;

    try {
        const clickDetails = await Click.findById(clickId);

        if (!clickDetails) {
            return res.status(404).json({ error: 'Click details not found' });
        }

        res.json(clickDetails);
    } catch (error) {
        console.error('Error fetching click details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/admin/ban', authMiddleware, checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    const { userAgent, ipAddress } = req.body;

    try {
        const newBan = new Ban({ userAgent, ipAddress });
        await newBan.save();

        res.json({ message: 'User-Agent/IP banned successfully.' });
    } catch (error) {
        console.error('Error banning User-Agent/IP:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/admin/uiretrieve', authMiddleware, checkAuth, checkAdminRole, isAdminMiddleware, async (req, res) => {
    try {
        const bannedItems = await Ban.find({}, 'ipAddress userAgent');

        res.json({ bannedItems: bannedItems });
    } catch (error) {
        console.error('Error fetching banned items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/admin/uiremove', authMiddleware, checkAuth, checkAdminRole, isAdminMiddleware,async (req, res) => {
    try {
        const bannedItem = req.body.bannedItem;

        await Ban.findOneAndDelete({ $or: [{ ipAddress: bannedItem }, { userAgent: bannedItem }] });

        res.json({ success: true, message: 'Banned item removed successfully' });
    } catch (error) {
        console.error('Error removing banned item:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


module.exports = router;
 