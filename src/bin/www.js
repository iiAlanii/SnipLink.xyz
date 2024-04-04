const app = require('../app');
const http = require('http');
const connectDB = require('../utils/db');
const morgan = require('morgan')
const port = normalizePort(process.env.PORT);
const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');
const path = require('path');
app.set('port', port)


const environment = process.env.ENVIRONMENT || 'development';
const allowedHosts = {
  'development': process.env.DEVELOPMENT_HOST,
  'production': process.env.PRODUCTION_HOST
};

const host = allowedHosts[environment];

let server;
const { initializeLogger } = require('../utils/UserLogger');

async function startServer() {
  try {
    console.log('Starting server...')
    await connectDB();
    console.log('Database connected');

    await initializeLogger();
    console.log('UserLogger initialized successfully');

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
      '/404',
      '/505',
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

    const sitemap = await streamToPromise(smStream).then(data => data.toString());
    fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully');


    server = http.createServer(app);
    server.listen(port, host);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (err) {
    console.error('Failed to connect to the database', err);
    process.exit(1);
  }
}
morgan.token('url', (req) => {
  return req.originalUrl.split('?')[0];
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));



function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

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

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

startServer().then(() => console.log(`Server started in ====> [${environment.toUpperCase()}] <==== mode`))
    .catch(err => console.error('Error starting server:', err));