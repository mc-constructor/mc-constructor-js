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
    'lib/**/*.spec.ts',
    'minigames/**/*.spec.ts',
  ]
}
