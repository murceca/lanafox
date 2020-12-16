var express = require('express');
var router = express.Router();

/* GET Privacy policy page. */
router.get('/', function(req, res) {
  res.render('privacy-policy');
});

module.exports = router;