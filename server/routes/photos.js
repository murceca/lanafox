var express = require('express');
var router = express.Router();

/* GET photos page. */
router.get('/', function(req, res, next) {
  res.render('photos', { title: 'Photos' });
});

module.exports = router;