const express = require('express');
const router = express.Router();

/* GET contact page. */
router.get('/', function(req, res, next) {
  res.render('contact', { title: 'Contact' });
});

/* Contact form submit. */
router.post('/', function(req, res, next) {
  let emailSent = false;
  res.json({
    reqName: req.body.name,
    reqEmail: req.body.email,
    reqMessage: req.body.message,
    success: emailSent
  });
});

module.exports = router;