const nodemailer = require('nodemailer');
const configs = require('../configs');

const sendEmail = async (body) => {
  let account;
  if (configs.IS_PRODUCTION_ENVIRONMENT) {
    account = {
      user: configs.SMTP_ACCOUNT_LOGIN,
      pass: configs.SMTP_ACCOUNT_PASSWORD
    };
  } else {
    account = await nodemailer.createTestAccount();
  }

  const transporter = nodemailer.createTransport({
    host: configs.SMTP_HOST,
    port: configs.SMTP_PORT,
    secure: configs.SMTP_SECURE,
    auth: {
      user: account.user,
      pass: account.pass,
    }
  });

  const info = await transporter.sendMail({
    from: account.user,
    to: configs.CONTACT_EMAIL,
    subject: `Contact email from the ${configs.DOMAIN_NAME}`,
    html: body
  });

  return info;
};

module.exports = {
  sendEmail
};