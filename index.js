const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const consola = require('consola');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');
const flash = require('express-flash');
const MongoStore = require('connect-mongo')(session);
const compression = require('compression');
const helmet = require('helmet');
const lusca = require('lusca');
const moment = require('moment');
const path = require('path');
const User = require('./models/User');
/**
 * Load environment variables from the .env file, where API keys and passwords are stored.
 */
require('dotenv').config();

/**
 * Create Express server.
 *
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true
});
const db = mongoose.connection;

/**
 * Load assets from public folder.
 */
app.use(express.static(`${__dirname}/public`));
app.use(
  '/bower_components',
  express.static(path.join(__dirname, './bower_components'))
);

/**
 * Set global viewmode
 */
app.set('view engine', 'ejs');

/**
 * Set view engine dir
 * Have to as the code is in the src folder.  You can remove this if you upload to prod or not.
 */
app.set('views', `${__dirname}/views`);

/**
 * Express configuration (compression, logging, body-parser,methodoverride)
 */
app.set('host', process.env.IP || '127.0.0.1');
app.set('port', process.env.PORT || 3000);
app.use(methodOverride('_method'));

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(helmet());
app.use(compression());
app.use(flash());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

switch (process.env.NODE_ENV) {
  case 'production':
    app.use(logger('combined'));
    app.enable('trust proxy');
    app.set('trust proxy', 1);
    break;
  default:
    app.use(logger('dev'));
}

/**
 * Setup Sessions
 */
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }, // Two weeks in milliseconds
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

/**
 *  CSRF
 */
app.use((req, res, next) => {
  if (
    req.path === '/api' ||
    RegExp('/api/.*').test(req.path) ||
    process.env.NODE_ENV === 'test'
  ) {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    // eslint-disable-next-line no-underscore-dangle
    res.locals._csrf = '';
    next();
  } else {
    lusca.referrerPolicy('same-origin');
    lusca.csrf()(req, res, next);
  }
});

/**
 * Passport middleware configuration.
 */
app.use(passport.initialize());

require('./config/passport')(passport);

app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(null, user);
  });
});

/**
 * Express Middleware
 */
app.use((req, res, next) => {
  res.locals.moment = moment;
  res.locals.siteTitle = process.env.TITLE;
  res.locals.footerText = process.env.FOOTER_TEXT;
  res.locals.footerLink = process.env.FOOTER_LINK;
  res.locals.siteDesc = process.env.DESCRIPTION;
  res.locals.siteURL = process.env.FULL_DOMAIN;
  res.locals.currentUser = req.user;
  res.locals.currentPath = req.path;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

/**
 * Primary app routes.
 */

const indexRoute = require('./routes/index');

app.use(indexRoute);
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: [
      'user-read-email',
      'user-read-recently-played',
      'user-read-currently-playing'
    ]
  })
);
app.get(
  '/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/**
 * Handle 404 errors
 */
app.use((req, res, next) => {
  res.status(404);
  res.status(404).send('Whoops, this resource or route could not be found');
});

app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // handle CSRF token errors here
  res.status(403);
  res.json({
    message: 'Please Try again.',
    error: {}
  });
});
/**
 * Express actions
 */
db.on('error', () => {
  consola.error(
    new Error('MongoDB connection error. Please make sure MongoDB is running.`')
  );
});

db.once('open', () => {
  app.listen(app.get('port'), () => {
    /**
     *  Log infomation after everything is started.
     */
    if (process.env.NODE_ENV !== 'test') {
      consola.log('----------------------------------------');
      consola.info(`Environment: ${app.get('env')}`);
      consola.info(`App URL: http://localhost:${app.get('port')}`);
      consola.log('----------------------------------------');
    }
  });
});

/**
 * Cloes connection to mongodb on exit.
 */
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    consola.success(
      'Mongoose connection is disconnected due to application termination'
    );
    process.exit(0);
  });
});
