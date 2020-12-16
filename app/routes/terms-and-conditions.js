var express = require('express');
var router = express.Router();

/* GET Terms and conditions page. */
router.get('/', function(req, res) {
  res.render('terms-and-conditions');
});

module.exports = router;