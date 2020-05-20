import { axisValue, loc } from '@ts-mc/core/types'
import { expect } from 'chai'

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

  describe('ModifyCoordinates', () => {

    describe('offset', () => {

      it('returns a new Coordinates object modified by the specified offset', () => {
        const initial = loc(10, 15, 20)
        const offset = loc(1, 2, 3)

        expect(initial.modify.offset(offset)).to.deep.equal(loc(11, 17, 23))
      })

    })

    describe('subtractOffset', () => {

      it('returns a new Coordinates object modified by the specified offset', () => {
        const initial = loc(10, 15, 20)
        const offset = loc(1, 2, 3)

        expect(initial.modify.subtractOffset(offset)).to.deep.equal(loc(9, 13, 17))
      })

    })

  })

})
