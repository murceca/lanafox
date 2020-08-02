const path = require('path');

module.exports = {
  VIEWS_ABS_PATH: path.join(__dirname, 'views'),
  PARTIALS_ABS_PATH: path.join(__dirname, 'views', 'partials'),
  STATIC_ABS_PATH: path.join(__dirname, 'public'),
  PHOTOS_REL_PATH: path.join('images', 'photos'),
  PHOTOS_ABS_PATH: path.join(__dirname, 'public', 'images', 'photos'),
};