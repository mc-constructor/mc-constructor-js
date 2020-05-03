const chai = require('chai')
chai.use(require('sinon-chai'))

const chaiMarbles = require('../rxjs-marbles/chai')
chai.use(chaiMarbles)
require('../rxjs-marbles/mocha')(chaiMarbles.config)

chai.use(require('../lib/common/testing/chai/minecraft'))
