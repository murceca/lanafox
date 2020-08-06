const express = require('express');
const router = express.Router();

/* GET contact page. */
router.get('/', function (req, res, next) {
  res.render('contact', {
    title: 'Contact'
  });
});

/* Contact form submit. */
router.post('/', async function (req, res, next) {
  let emailSent = false;
  try {
    const emailBody = await (async () => {
      return new Promise((resolve, reject) => {
        res.render('contact-email', {
          layout: null,
          name: req.body.name,
          email: req.body.email,
          message: req.body.message
        }, (error, data) => {
          if (error) {
            reject(error);
          }
          resolve(data);
        });
      });
    })();
    const info = await require('../utils/email').sendEmail(emailBody);
    if (info && info.response) {
      emailSent = info.response.indexOf('200') !== -1
        || info.response.indexOf('250') !== -1;
    }
  } catch(error) {
    console.error(error);
  }
  res.json({
    success: emailSent
  });
});

module.exports = router;