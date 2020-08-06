const express = require('express');
const router = express.Router();
const imageUtils = require('../utils/image');

/* GET photos page. */
router.get('/', function(req, res, next) {
  const imagesLoader = new imageUtils.ImagesLoader();
  const photos = imagesLoader.getImages();
  res.render('photos', {
    title: 'Photos',
    photos: photos
  });
});

module.exports = router;