const hbs = require('hbs');
const fs = require('fs');
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
};

const init = () => {
  registerPartials();
  registerHelpers();
};

module.exports = {
  init
};