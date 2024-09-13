const app = require('../app');
const http = require('http');
const fs = require('fs');
const connectDB = require('../utils/db');
const morgan = require('morgan');
const { SitemapStream, streamToPromise } = require('sitemap');
const path = require('path');
const { initializeLogger } = require('../utils/UserLogger');

const port = normalizePort(process.env.PORT || '3000');
const environment = process.env.ENVIRONMENT || 'production';
const allowedHosts = {
  development: process.env.DEVELOPMENT_HOST || 'localhost',
  production: process.env.PRODUCTION_HOST || '64.23.182.61'
};
const host = allowedHosts[environment];

app.set('port', port);

morgan.token('url', (req) => req.originalUrl.split('?')[0]);
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

async function generateSitemap() {
  app.set('generateSitemap', generateSitemap);
  const urls = [
    '/public/',
    '/public/images/',
    '/public/javascripts/',
    '/public/stylesheets/',
    '/fb/feedback',
    '/fb/submitFeedback',
    '/help/help-center',
    '/help/suggestions',
    '/legal/privacy-policy',
    '/legal/terms-of-service',
    '/analytics',
    '/dashboard',
    '/index',
    '/login',
    '/logout',
    '/manage-links',
    '/shortener',
  ];

  const smStream = new SitemapStream({ hostname: 'https://sniplink.xyz' });
  urls.forEach(url => smStream.write({ url }));
  smStream.end();

  return await streamToPromise(smStream).then(data => data.toString());

}

async function startServer() {
  try {
    console.log('Starting server...');
    await connectDB();
    console.log('Database connected');

    await initializeLogger();
    console.log('UserLogger initialized successfully');

    await generateSitemap();

    const server = http.createServer(app);

    server.listen(port, host);
    server.on('error', onError);
    server.on('listening', () => onListening(server));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer().then(() => {
  console.log(`Server started in ====> [${environment.toUpperCase()}] <==== mode`);
}).catch(err => console.error('Error starting server:', err));
module.exports.generateSitemap = generateSitemap;
