const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const hbs = require('hbs');

const configs = require('./configs');

const indexRouter = require('./routes/index');
const photosRouter = require('./routes/photos');
const contactRouter = require('./routes/contact');

const app = express();

// view engine setup
app.set('views', configs.VIEWS_ABS_PATH);
app.set('view engine', 'hbs');
let partialsDir = configs.PARTIALS_ABS_PATH;
let partialsFilenames = fs.readdirSync(partialsDir);
partialsFilenames.forEach(function (partialFile) {
  let matches = /^([^.]+).hbs$/.exec(partialFile);
  if (!matches) {
    return;
  }
  let name = matches[1];
  let template = fs.readFileSync(partialsDir + '/' + partialFile, 'utf8');
  hbs.registerPartial(name, template);
});

hbs.registerHelper('productionEnv', () => {
  return configs.IS_PRODUCTION_ENVIRONMENT;
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(configs.STATIC_ABS_PATH));

app.use('/', indexRouter);
app.use('/photos', photosRouter);
app.use('/contact', contactRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
