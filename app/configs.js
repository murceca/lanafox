const path = require('path');

module.exports = {
  VIEWS_ABS_PATH: path.join(__dirname, 'views'),
  PARTIALS_ABS_PATH: path.join(__dirname, 'views', 'partials'),
  STATIC_ABS_PATH: path.join(__dirname, 'public'),
  IS_PRODUCTION_ENVIRONMENT: process.env.NODE_ENV === 'production',
  PORT: process.env.PORT || 3000,
  DOMAIN_NAME: 'lanafox.info',
  CONTACT_EMAIL: 'contact@lanafox.info',
  SMTP_HOST: process.env.NODE_ENV === 'production' ? (process.env.SMTP_HOST || '') : 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,  // true for 465, false for other ports
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || false,
  SMTP_ACCOUNT_LOGIN: process.env.SMTP_ACCOUNT_LOGIN || '',
  SMTP_ACCOUNT_PASSWORD: process.env.SMTP_ACCOUNT_PASSWORD || ''
};