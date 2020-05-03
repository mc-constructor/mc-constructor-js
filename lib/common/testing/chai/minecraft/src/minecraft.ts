import { isArea, isCoordinates } from '../../../../../types'
import { Assertion } from 'chai'

import AssertionStatic = Chai.AssertionStatic

export const chaiMinecraft = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
  Assertion.overwriteMethod('within', function(this: AssertionStatic, _super: any) {
    return function contain(this: any, expected: any) {
      const obj = utils.flag(this, 'object')
      if (!isArea(expected) || !isCoordinates(obj)) {
        return _super.apply(this, arguments)
      }

      if (!expected.contains(obj)) {
        const ssfi = utils.flag(this, 'ssfi')
        throw new chai.AssertionError(
          `Expected coordinates ${obj} to be within area ${expected}`,
          undefined,
          ssfi,
        )
      }
    }
  })
}
