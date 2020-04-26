const chai = require('chai')
chai.use(require('sinon-chai'))
chai.use(require('../rxjs-marbles/chai'))
require('../rxjs-marbles/mocha')((actual, expected) => chai.expect(expected).to.deep.equal(actual))
