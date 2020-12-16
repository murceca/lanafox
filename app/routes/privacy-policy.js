const express = require('express');
const router = express.Router();

/* GET Privacy policy page. */
router.get('/', (req, res) => {
  res.render('privacy-policy');
});

module.exports = router;