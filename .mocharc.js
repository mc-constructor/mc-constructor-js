const { resolve } = require('path')

module.exports = {
  extension: 'ts',
  ignore: [
    '.jar',
    '.server',
  ],
  watchIgnore: [
    '.jar',
    '.server'
  ],
  require: [
    'tsconfig-paths/register',
    'ts-node/register',
    // resolve(__dirname, './test/ts-node.js'),
    'ts-custom-error-shim',
    resolve(__dirname, './test/mocha.config'),
  ],
  spec: [
    'lib/**/index.ts',
    'lib/**/*.spec.ts',
    'minigames/**/index.ts',
    'minigames/**/*.spec.ts',
    'rxjs-marbles/**/index.ts',
    'rxjs-marbles/**/*.spec.ts',

    'lib/**/*.int-spec.ts',
  ]
}
