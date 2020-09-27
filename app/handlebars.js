const hbs = require('hbs');
const fs = require('fs');
const i18n = require('i18n');
const configs = require('./configs');

const registerPartials = () => {
  let partialsDir = configs.PARTIALS_ABS_PATH;
  let partialsFilenames = fs.readdirSync(partialsDir);
  partialsFilenames.forEach(function (partialFile) {
    let matches = /^([^.]+).hbs$/.exec(partialFile);
    if (!matches) {
      return;
    }
    let name = matches[1];
    let template = fs.readFileSync(partialsDir + '/' + partialFile, 'utf8');
    hbs.registerPartial(name, template);
  });
};

const registerHelpers = () => {
  hbs.registerHelper('productionEnv', () => {
    return configs.IS_PRODUCTION_ENVIRONMENT;
  });

  hbs.registerHelper('__', function () {
    return i18n.__.apply(this, arguments);
  });

  hbs.registerHelper('__n', function () {
    return i18n.__n.apply(this, arguments);
  });
};

const init = () => {
  registerPartials();
  registerHelpers();
};

module.exports = {
  init
};