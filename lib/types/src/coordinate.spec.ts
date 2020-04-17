import { expect } from 'chai'

import { axisValue } from './coordinates'

describe('coordinates', () => {

  describe('AxisValue', () => {

    describe('between', () => {
      it('returns true if the value is between two others', () => {
        const a = axisValue(-5)
        const b = axisValue(5)
        const test = axisValue(0)

        expect(test.between(a, b)).to.be.true
        expect(test.between(b, a)).to.be.true
      })

      it('returns false if the value is not between two others', () => {
        const a = axisValue(8)
        const b = axisValue(5)
        const test = axisValue(0)

        expect(test.between(a, b)).to.be.false
        expect(test.between(b, a)).to.be.false
      })
    })

  })

})
