import { expect } from 'chai'

import { area } from './area'
import { Coordinates, loc } from './coordinates'

describe('Area', () => {

  describe('contains', () => {

    function test(expected: boolean, test: Coordinates, start: Coordinates, end: Coordinates): void {
      it(`returns ${expected} if ${test} is within ${start} and ${end}`, () => {
        expect(area(start, end).contains(test)).to.equal(expected)
        expect(area(end, start).contains(test)).to.equal(expected)
      })
    }

    test(true, loc(5, 5, 5), loc(0, 0, 0), loc(10, 10, 10))
    test(false, loc(5, 5, 5), loc(6, 0, 0), loc(10, 10, 10))

  })

})
