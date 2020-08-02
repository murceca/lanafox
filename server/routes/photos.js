const express = require('express');
const router = express.Router();
const fs = require('fs');
const junk = require('junk');
const configs = require('../configs');

/* GET photos page. */
router.get('/', function(req, res, next) {
  const photos = fs.readdirSync(configs.PHOTOS_ABS_PATH)
    .filter(junk.not)
    .map(photoFileName => {
      return `/${configs.PHOTOS_REL_PATH}/${photoFileName}`;
    });
  res.render('photos', {
    title: 'Photos',
    photos: photos || []
  });
});

module.exports = router;