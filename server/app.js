const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const hbs = require('hbs');

const indexRouter = require('./routes/index');
const photosRouter = require('./routes/photos');
const contactRouter = require('./routes/contact');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
let partialsDir = path.join(__dirname,'views', 'partials');
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
