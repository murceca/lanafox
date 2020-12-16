const express = require('express');
const router = express.Router();

/* GET contact page. */
router.get('/', (req, res) => {
  res.render('contact', {
    title: 'Contact',
    isContactPage: true
  });
});

/* Contact form submit. */
router.post('/', async (req, res) => {
  let emailSent = false;
  let emailData = {
    name: req.body.name,
    email: req.body.email,
    message: req.body.message
  };
  let hasEmptyField = !!Object.values(emailData).filter(val => !val).length;
  if (hasEmptyField) {
    return res.sendStatus(400);
  }
  try {
    const emailBody = await (async () => {
      return new Promise((resolve, reject) => {
        emailData = Object.assign(emailData, {
          layout: null
        });
        res.render('contact-email', emailData, (error, data) => {
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

  if (!emailSent) {
    res.sendStatus(500);
  } else {
    res.sendStatus(200);
  }
});

module.exports = router;