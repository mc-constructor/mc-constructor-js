import { expect } from "chai"

describe('mocha-marbles', () => {

  describe('without marbles', () => {
    it('works', () => {
      expect(true).to.be.true
    })
  })

  describe.marbles('with marbles', () => {
    it('works', () => {
      expect(true).to.be.true
    })
  })

})

