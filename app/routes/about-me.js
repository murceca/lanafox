var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('about-me', {
    isHomePage: true
  });
});

module.exports = router;
