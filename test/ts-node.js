const { resolve } = require('path')

const project = resolve(__dirname, '../tsconfig.dev.json')
const config = require(project)

require('tsconfig-paths').register({
  baseUrl: config.compilerOptions.baseUrl,
  paths: config.compilerOptions.paths,
})

require('ts-node').register({
  project,
  // transpileOnly: true,
})
