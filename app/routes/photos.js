const express = require('express');
const router = express.Router();
const imageUtils = require('../utils/image');

/* GET photos page. */
router.get('/', function(req, res) {
  const imagesLoader = new imageUtils.ImagesLoader();
  const photos = imagesLoader.getImages({
    itemsInRow: 3
  });
  res.render('photos', {
    title: 'Photos',
    photos: photos,
    isPhotosPage: true
  });
});

module.exports = router;