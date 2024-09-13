const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { User } = require('../models/index');
const logSecurityEvent = require('../ServerLogging/SecurityLogger');
const { DiscordWebhookLogger, UserLoginLogger } = require('../utils/discordWebhookLogger');
const { encrypt } = require('../utils/encryptionUtils');

const discordLogger = new DiscordWebhookLogger();
const userLoginLogger = new UserLoginLogger(discordLogger);

const clientID = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;

let redirectURI;
if (process.env.ENVIRONMENT === 'development') {
    redirectURI = "https://sniplink.xyz/auth/discord/callback";
} else {
    redirectURI ="https://sniplink.xyz/auth/discord/callback";
}

passport.use(new DiscordStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: redirectURI,
    scope: ['identify', 'email'],
    state: true,
}, async (accessToken, refreshToken, profile, done) => {
    console.log('Entered Discord Strategy callback');

    try {
        console.log(`Access Token: ${accessToken}`);
        console.log(`Refresh Token: ${refreshToken}`);
        console.log(`Profile: ${JSON.stringify(profile)}`);

        const updatedProfile = await fetchDiscordUserProfile(accessToken);
        console.log(`Updated Profile: ${JSON.stringify(updatedProfile)}`);

        let user = await User.findOne({ discordId: updatedProfile.id });
        console.log(user ? 'User found in database' : 'User not found, creating new');

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
            console.log(`New user registered: ${updatedProfile.username} (${updatedProfile.id})`);

            logSecurityEvent(`New user registered: ${updatedProfile.username} (${updatedProfile.id})`);
        } else {
            user.profilePicture = profilePicture;
            user.email = encryptedEmail;
            console.log(`User updated: ${updatedProfile.username} (${updatedProfile.id})`);

            await user.save();
        }

        console.log(`User login successful: ${updatedProfile.username} (${updatedProfile.id})`);

        done(null, updatedProfile);


        userLoginLogger.logUserLogin(updatedProfile.username, updatedProfile.id, 'Success', profilePicture);
    } catch (err) {
        const profilePicture = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : 'https://imgur.com/PnmfcZy';


        userLoginLogger.logUserLogin(profile.username, profile.id, `Error: ${err.message}`, profilePicture);
        console.error(`Error during authentication: ${err.message}`);
        return done(err);
    }
}));

async function fetchDiscordUserProfile(accessToken) {
    console.log(`Making API request to Discord with accessToken: ${accessToken}`);

    const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        console.error(`Failed to fetch user profile from Discord API: ${response.statusText}`);

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
