const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const flags = process.argv.slice(2);
if (flags.some(argument => argument !== '--coverage')) {
  throw new Error('Only --coverage is supported');
}
const coverage = flags.includes('--coverage');
const cwd = path.resolve(__dirname, '..');
if (coverage) fs.mkdirSync(path.join(cwd, 'coverage'), { recursive: true });

const testArguments = ['--test'];
if (coverage) {
  testArguments.push(
    '--experimental-test-coverage',
    '--test-reporter=spec',
    '--test-reporter=lcov',
    '--test-reporter-destination=stdout',
    '--test-reporter-destination=coverage/lcov.info',
  );
}
testArguments.push('tests/mailer.test.js');

for (const args of [['tests/match3.test.js'], testArguments]) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
