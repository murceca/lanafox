const express = require('express');
const router = express.Router();
const imageUtils = require('../utils/image');

/* GET portfolio page. */
router.get('/', async function(req, res) {
  const imagesLoader = new imageUtils.ImagesLoader();
  const photos = await imagesLoader.getImages({
    itemsInRow: 3
  });
  res.render('portfolio', {
    title: 'Portfolio',
    photos,
    isPortfolioPage: true
  });
});

module.exports = router;