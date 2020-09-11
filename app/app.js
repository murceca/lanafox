const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const configs = require('./configs');
const handlebars = require('./handlebars');
const app = express();

// view engine setup
app.set('views', configs.VIEWS_ABS_PATH);
app.set('view engine', 'hbs');
handlebars.init();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(configs.STATIC_ABS_PATH));

app.use('/', require('./routes/index'));
app.use('/photos', require('./routes/photos'));
app.use('/contact', require('./routes/contact'));
app.use(require('./routes/not-found'));

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