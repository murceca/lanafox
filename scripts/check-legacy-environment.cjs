const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadEnvironment } = require('../app/utils/environment');

const logs = [];
const origLog = console.log;
console.log = (...args) => logs.push(args.join(' '));

try {
  // 1. Missing .env file is allowed
  const missingResult = loadEnvironment({
    envPath: path.join(os.tmpdir(), 'nonexistent-lanafox.env'),
    env: {},
  });
  assert.equal(missingResult.hasDotenvFile, false);

  // 2. Valid .env file loads without logging secret values
  const tmpFile = path.join(os.tmpdir(), `lanafox-env-${process.pid}.env`);
  fs.writeFileSync(tmpFile, 'SECRET_TOKEN=super-secret-value\nPORT=3100\n');
  try {
    const env = {};
    const loaded = loadEnvironment({ envPath: tmpFile, env });
    assert.equal(loaded.hasDotenvFile, true);
    assert.equal(env.SECRET_TOKEN, 'super-secret-value');
    assert.equal(logs.some((line) => line.includes('super-secret-value')), false);
  } finally {
    fs.unlinkSync(tmpFile);
  }

  // 3. Read error (e.g. directory instead of file) is redacted
  assert.throws(
    () => loadEnvironment({ envPath: os.tmpdir(), env: {} }),
    /Failed to load environment file/,
  );

  // 4. Invalid PORT is rejected
  assert.throws(
    () =>
      loadEnvironment({
        envPath: path.join(os.tmpdir(), 'nonexistent-lanafox.env'),
        env: { PORT: 'invalid' },
      }),
    /Invalid PORT configuration/,
  );

  assert.equal(logs.length, 0);
} finally {
  console.log = origLog;
}
console.log('Legacy environment verification passed.');

