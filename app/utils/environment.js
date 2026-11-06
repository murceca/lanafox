const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnvironment(options = {}) {
  const envPath = options.envPath || path.resolve(__dirname, '..', '.env');
  const env = options.env || process.env;
  let hasDotenvFile = false;

  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const parsed = dotenv.parse(content);
    for (const [key, value] of Object.entries(parsed)) {
      if (env[key] === undefined) {
        env[key] = value;
      }
    }
    hasDotenvFile = true;
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw new Error('Failed to load environment file');
    }
  }

  if (env.PORT !== undefined && env.PORT !== '') {
    const port = Number(env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Invalid PORT configuration');
    }
  }

  return {
    nodeEnv: env.NODE_ENV || 'development',
    hasDotenvFile,
  };
}

module.exports = { loadEnvironment };
