const express = require('express');
const router = express.Router();

/* GET Terms and conditions page. */
router.get('/', (req, res) => {
  res.render('terms-and-conditions');
});

module.exports = router;