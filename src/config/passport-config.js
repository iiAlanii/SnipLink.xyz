const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/user');
const logSecurityEvent = require('../ServerLogging/SecurityLogger');
const { DiscordWebhookLogger, UserLoginLogger } = require('../utils/discordWebhookLogger');
const { encrypt } = require('../utils/encryptionUtils');

const discordLogger = new DiscordWebhookLogger();
const userLoginLogger = new UserLoginLogger(discordLogger);

const clientID = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const redirectURI = process.env.REDIRECTURI;

passport.use(new DiscordStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: redirectURI,
    scope: ['identify', 'email'],
    state: true,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const updatedProfile = await fetchDiscordUserProfile(accessToken);

        let user = await User.findOne({ discordId: updatedProfile.id });

        const profilePicture = updatedProfile.avatar ? `https://cdn.discordapp.com/avatars/${updatedProfile.id}/${updatedProfile.avatar}.png` : 'default_avatar_url';

        const encryptedEmail = encrypt(updatedProfile.email);

        if (!user) {
            const newUser = new User({
                discordId: updatedProfile.id,
                username: updatedProfile.username,
                email: encryptedEmail,
                profilePicture: profilePicture,
            });
            await newUser.save();
            logSecurityEvent(`New user registered: ${updatedProfile.username} (${updatedProfile.id})`);
        } else {
            user.profilePicture = profilePicture;
            user.email = encryptedEmail;
            await user.save();
        }

        done(null, updatedProfile);

        userLoginLogger.logUserLogin(updatedProfile.username, updatedProfile.id, 'Success', profilePicture);
    } catch (err) {
        const profilePicture = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : 'https://imgur.com/PnmfcZy';

        userLoginLogger.logUserLogin(profile.username, profile.id, `Error: ${err.message}`, profilePicture);
        return done(err);
    }
}));

async function fetchDiscordUserProfile(accessToken) {
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user profile from Discord API: ${response.statusText}`);
    }

    return response.json();
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;