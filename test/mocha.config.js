const chai = require('chai')
chai.use(require('sinon-chai'))

const { chaiMarbles, config } = require('@rxjs-stuff/marbles/chai')
chai.use(chaiMarbles)
require('@rxjs-stuff/marbles/mocha/node').mochaMarbles(config)

chai.use(require('../lib/common/testing/chai/minecraft'))
