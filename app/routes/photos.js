const express = require('express');
const router = express.Router();
const imageUtils = require('../utils/image');

/* GET photos page. */
router.get('/', async function(req, res) {
  const imagesLoader = new imageUtils.ImagesLoader();
  const photos = await imagesLoader.getImages({
    itemsInRow: 3
  });
  res.render('photos', {
    title: 'Photos',
    photos: photos,
    isPhotosPage: true
  });
});

module.exports = router;