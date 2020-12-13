const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const configs = require('./configs');
const handlebars = require('./handlebars');
const i18n = require('i18n');
const app = express();

// view engine setup
app.set('views', configs.VIEWS_ABS_PATH);
app.set('view engine', 'hbs');
handlebars.init();

// localization
i18n.configure({
  locales: ['uk', 'en'],
  fallbacks: {'uk': 'en'},
  defaultLocale: 'en',
  cookie: 'locale',
  queryParameter: 'lang',
  directory: __dirname + '/locales',
  directoryPermissions: '755',
  autoReload: true,
  updateFiles: false,
  objectNotation: true
});
app.use(i18n.init);
app.use(function(req, res, next) {
  res.locals.activeLocale = req.getLocale();
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(configs.STATIC_ABS_PATH));

app.use(function(req, res, next) {
  res.locals.canonicalUrl = `${req.protocol}://${req.get('host') + req.originalUrl}`;
  res.locals.host = `${req.protocol}://${req.get('host')}`;
  next();
});

app.use('/', require('./routes/about-me'));
app.use('/portfolio', require('./routes/portfolio'));
app.use('/contact', require('./routes/contact'));
app.use('/privacy-policy', require('./routes/privacy-policy'));
app.use('/terms-and-conditions', require('./routes/terms-and-conditions'));
app.use(require('./routes/not-found'));

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = configs.IS_PRODUCTION_ENVIRONMENT ? {} : err;

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
