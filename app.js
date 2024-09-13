require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');

const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const passport = require('./config/passport-config');
const { v4: uuidv4 } = require('uuid');
const app = express();
const identifyRoute = require('./routes/api/v1/discord/identify');

const authRoutes = require('./routes/auth');
const dashboardRoute = require('./routes/dashboard');
const analyticsRoute = require('./routes/analytics');
const adRoute = require('./routes/ad');
const shortenRoute = require('./routes/shorten');
const shortenerRoute = require('./routes/shortener');
const logoutRoute = require('./routes/logout');
const shortCodeRedirectRoute = require('./routes/shortCodeRedirect');
const adminRoute = require('./routes/admin');
const availabilityRoute = require('./routes/availability');
const apiRoute = require('./routes/api/v1/common/shorten');
const apiRoute2 = require('./routes/api/v2/shorten');
const apiShortenRoute = require('./routes/apiShorten');
const editLinkRoute = require('./routes/editLink');
const apiPageRoute = require('./routes/apiPage');
const linkRoutes = require('./routes/linkRoutes');
const cors = require('cors');

const rateLimiterMiddleware = require('./middleware/rateLimiterMiddleware');
const loginLimiter = require('./middleware/loginRateLimiter'); //TODO: Implement this into the server

const { getTotalLinks, getTotalUsers } = require('../src/utils/statisticsUtils');
const allowedTesters = require('./utils/allowedTesters');

const { DiscordWebhookLogger, ServerErrorLogger } = require('./utils/discordWebhookLogger');
const discordLogger = new DiscordWebhookLogger();
const checkMaintenanceMode = require('./middleware/maintenanceMode');
const { validateToken } = require('../src/utils/tokenUtils');

const checkAuth = require('./checkAuth/auth');
const banCheckMiddleware = require('./middleware/banCheckMiddleware');
const requestLoggerMiddleware = require('./middleware/requestLoggerMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');
const accessLogger = require('./ServerLogging/AccessLogger');
// const securityHeadersMiddleware = require('./middleware/securityHeadersMiddleware');
const middlewares = require('../src/middleware/serverRestrictions');

const clicksByCountryRoute = require('./routes/analytics/clicksByCountry');
const topReferrersRoute = require('./routes/analytics/topReferrers');
const uIbanCheckMiddleware = require('./middleware/uIbanCheckMiddleware');
const { generateAuthKey, authMiddleware } = require('../src/middleware/authMiddleware');

const underConstructionMiddleware = require('./middleware/underConstructionMiddleware');

const { UserLogger } = require('./utils/UserLogger');
const checkAuthRoute = require('./routes/checkAuth');

const loginRouter = require('./routes/login');

const linkrRouter = require('./routes/linkr');
const connectRouter = require('./routes/linkr/connect');

const apiLinkAnalyticsRoute = require('./routes/apiLinkAnalytics');
const feedbackSubmitRouter = require('../src/routes/feedback/submitFeedback')

global.errorLogger = new ServerErrorLogger(discordLogger);

const disallowedMethods = ['HEAD', 'PUT', 'DELETE'];

app.use((req, res, next) => {
  if (disallowedMethods.includes(req.method)) {
    return res.status(405).send('Method Not Allowed');
  }
  next();
});

const getMongoUri = () => {
  switch (process.env.ENVIRONMENT) {
    case 'production':
      return process.env.PROD_MONGO_URI;
    case 'development':
      return process.env.DEV_MONGO_URI;
    default:
      return process.env.MONGO_URI;
  }
};

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: getMongoUri() }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
};

if (process.env.ENVIRONMENT === 'production') {
  sessionOptions.cookie.secure = true;
}

//app.set('trust proxy', process.env.ENVIRONMENT === 'production' ? 2 : false);
app.set('trust proxy', process.env.ENVIRONMENT === 'production' ? 2 : false);
console.log('NODE_ENV:', process.env.ENVIRONMENT);

console.log('Trust proxy setting:', app.get('trust proxy'));
global.errorLogger = new ServerErrorLogger(new DiscordWebhookLogger());


app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
}));

app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hidePoweredBy());
app.use(helmet.xssFilter());

app.use((req, res, next) => {
  const canonicalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.setHeader('Link', `<${canonicalUrl}>; rel="canonical"`);
  next();
});

app.use(cors());
app.use(cors({
  methods: ['GET', 'POST'],
}));

app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

const oneDayInSeconds = 24 * 60 * 60;
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath, {
  maxAge: oneDayInSeconds * 1000,
}));
app.use(express.static(publicPath));

const secrets = [
  'L&c@9W!xH4v5s8R1p3Zy2QfXoA',
  'B7r#kP6jYq0mF5e3zXg!w8vI9nO',
  'G2s&d4a1h5j8k3l0p9Q7zXcVbN',
  'R1a#s6d8f3g5h2j9k0L&iP7oZxQ',
  'M7bN3v2cX8z5A1s!gF6h9J#4kW',
  'Q0l6p9w8v2c5b1h4F3g!R7a#J@',
];

function getSecretKey() {
  const index = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % secrets.length;
  return secrets[index];
}
app.use(session(sessionOptions));
//app.use(securityHeadersMiddleware);
app.use(passport.initialize());
app.use(passport.session());


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(rateLimiterMiddleware);
//app.use(loginLimiter);

app.use(session({
  secret: getSecretKey(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
  /*
  genid: (req) => {
  //custom function to generate session IDs
  return uuid(); // use UUIDs for session IDs using genid
},
   */
}));

app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path);
    next();
  } catch (e) {
    if (e instanceof URIError) {
      res.status(400).send('Invalid URL');
    } else {
      next(e);
    }
  }
});

app.use((req, res, next) => {
  if (req.hostname === '104.248.17.38') {
    return res.status(403).send('Access Denied');
  }
  next();
});

app.use('/src', (req, res, next) => {
  res.status(403).send('Access forbidden');
});

app.use(bodyParser.json());

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/public')) {
    return next();
  }
  uIbanCheckMiddleware(req, res, next);
});











 /*app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/public')) {
    return next();
  }
  // banCheckMiddleware(req, res, next);
});
*/


app.use('/auth', authRoutes);
app.use('/api/v1/discord/identify', identifyRoute);
app.use('/login', loginRouter);
//UserBan = require('./models/UserBanSchema');
app.use('/checkAvailability', availabilityRoute);
app.use(requestLoggerMiddleware);
app.use(accessLogger);
app.use(checkMaintenanceMode);
app.use(underConstructionMiddleware);
app.use('/api/analytics/clicks-by-country', clicksByCountryRoute);
app.use('/api/analytics/top-referrers', topReferrersRoute);

app.get('/auth/isAuthenticated', authMiddleware, (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});
const tokens = new Set();







app.use('/checkAuth', checkAuthRoute)
app.use((req, res, next) => {
  if (req.user) {
    const discordId = String(req.user.id);
    const username = req.user.username;
    const email = req.user.email;
    const pfp = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`;

    const userLogger = new UserLogger(discordId, username, email, pfp);

    if (!req.originalUrl.endsWith('.css') && !req.originalUrl.endsWith('.js')) {
      userLogger.log(req.originalUrl);
    }
  }
  next();
});

app.get('/getCaptchaKey', authMiddleware, middlewares.restrictToServer, (req, res) => {
  res.json({ CAPTCHA_SITE_KEY: process.env.CAPTCHA_SITE_KEY });
});
app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

//start of linkr


app.get('/linkr/linkSuccess', middlewares.restrictToServer, (req, res) => {
  const shortenedUrl = req.query.shortenedUrl;
  res.render('linkr/linkSuccess', { shortenedUrl: shortenedUrl });
});

app.get('/linkr/alreadyLinked', middlewares.restrictToServer, (req, res) => {
  res.render('linkr/alreadyLinked');
});

app.get('/linkr/invalidLink', middlewares.restrictToServer, (req, res) => {
  res.render('linkr/invalidLink');
});

app.get('/linkr/redirect', middlewares.restrictToServer, (req, res) => {
  res.redirect('/linkr/invalidLink');
});

app.use('/linkr', linkrRouter);
app.use('/linkr/connect', connectRouter);



//end of linkr
app.use('/', apiLinkAnalyticsRoute);

app.use('/feedback/submitFeedback', feedbackSubmitRouter);
app.get('/fb/feedback', authMiddleware, checkAuth, middlewares.restrictToServer, (req, res) => {
  res.render('fb/feedback', { user: req.user,  allowedTesters: allowedTesters });
});
app.get('/fb/submitFeedback', middlewares.restrictToServer, checkAuth, (req, res) => {
  res.render('fb/submitFeedback', { user: req.user,  allowedTesters: allowedTesters });
});

app.get('/generateAuthKey', middlewares.restrictToServer, (req, res) => {
  const authKey = generateAuthKey();
  res.json({ authKey });
});
app.post('/validateToken', middlewares.restrictToServer, (req, res) => {
  const { token } = req.body;

  if (token && validateToken(token)) {
    tokens.delete(token);
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

app.get('/testers', checkAuth, (req, res) => {
  if (!req.user || !allowedTesters.includes(req.user.id)) {
    res.render('404.ejs');
  } else {
    res.render('testers', { user: req.user, allowedTesters: allowedTesters });
  }
});
app.post('/api/fingerprint', middlewares.restrictToServer, (req, res) => {
  req.session.fingerprint = req.body.fingerprint;
  res.sendStatus(200);
});


app.get('/', checkMaintenanceMode, middlewares.restrictToServer, async (req, res) => {
  try {
    const totalLinks = await getTotalLinks();
    const totalUsers = await getTotalUsers();

    res.render('index', { user: req.user, totalLinks, totalUsers, allowedTesters: allowedTesters });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/statistics', authMiddleware, async (req, res) => {
  res.set('Cache-Control', 'no-store');

  try {
    const totalLinks = await getTotalLinks();
    const totalUsers = await getTotalUsers();

    res.json({ totalLinks, totalUsers });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Endpoint
app.get('/help/help-center', (req, res) => {
  res.render('help/help-center', { user: req.user, allowedTesters: allowedTesters });
});

app.get('/legal/terms-of-service', (req, res) => {
  res.render('legal/terms-of-service', { user: req.user, allowedTesters: allowedTesters });
});

app.get('/legal/privacy-policy', (req, res) => {
  res.render('legal/privacy-policy', { user: req.user,  allowedTesters: allowedTesters });
});

app.use('/', editLinkRoute);
app.use('/', linkRoutes);


app.use('/dashboard', dashboardRoute);
app.use('/admin', adminRoute);
app.use('/logout', logoutRoute);
app.use('/shortener', shortenerRoute);
app.use('/shorten', shortenRoute);
app.use('/', shortCodeRedirectRoute); //TODO: remove the comment from this to use shortCodeRedirectRoute
app.use('/ad', adRoute); //TODO: Replace this with /ad if you want to use the shortCodeRedirectRoute
app.use('/analytics', analyticsRoute);
app.use('/api', apiShortenRoute);
app.use('/api/v1/common/shorten', apiRoute);

app.use('/api/v2/shorten', apiRoute2);
//apiLinks = require('./models/apiLink');



app.use('/api', apiPageRoute);
require('./utils/linkExpirationChecker');


let errorCount = 0;
let firstErrorTime = null;
const ERROR_LIMIT = 10;
const ERROR_TIME_PERIOD = 15 * 60 * 1000;

const { NotFoundLogger } = require('./utils/discordWebhookLogger');
const notFoundLogger = new NotFoundLogger();

app.use((req, res) => {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  const referer = req.headers.referer || 'Not available';
  const route = req.route ? req.route.path : 'Not available';
  const sessionId = req.session ? req.session.id : 'Not available';

  const now = Date.now();
  if (firstErrorTime === null) {
    firstErrorTime = now;
  }

  if (now - firstErrorTime <= ERROR_TIME_PERIOD) {
    if (errorCount < ERROR_LIMIT) {
      errorCount++;
      notFoundLogger.logNotFound(req.method, fullUrl, req.ip, req.headers['user-agent'], referer, route, sessionId, req.user ? req.user.id : undefined);
    }
  } else {

    errorCount = 1;
    firstErrorTime = now;
    notFoundLogger.logNotFound(req.method, fullUrl, req.ip, req.headers['user-agent'], referer, route, sessionId, req.user ? req.user.id : undefined);
  }

  res.status(404).render('404');
});

app.use(errorHandlerMiddleware);

app.use((err, req, res) => {
  const userId = req.user ? req.user.id : undefined;
  const requestId = req.id;

  const errorLocation = err.stack ? err.stack.split('\n')[1] || 'Not available' : 'Not available';

  global.errorLogger.logError(err.message, err.stack, userId, requestId, errorLocation);

  res.status(500).render('500', { error: err, status: 500 });
});

module.exports = app;
