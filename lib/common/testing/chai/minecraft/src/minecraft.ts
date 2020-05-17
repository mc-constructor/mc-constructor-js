import { isArea, isCoordinates } from '@ts-mc/core/types'
import { Assertion } from 'chai'

import AssertionStatic = Chai.AssertionStatic

export const chaiMinecraft = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
  Assertion.overwriteMethod('within', function(this: AssertionStatic, _super: any) {
    return function within(this: any, expected: any) {
      const obj = utils.flag(this, 'object')
      if (!isArea(expected) || !isCoordinates(obj)) {
        return _super.apply(this, arguments)
      }

      const isNegated = utils.flag(this, 'negate') || false
      const isWithin = expected.contains(obj)
      const isValid = isNegated ? !isWithin : isWithin

      if (!isValid) {
        const ssfi = utils.flag(this, 'ssfi')
        const userMsg = utils.flag(this, 'message')
        throw new chai.AssertionError(
          `${userMsg ? `${userMsg}: ` : ''}Expected coordinates ${obj}${isNegated ? ' not' : ''} to be within area ${expected}`,
          undefined,
          ssfi,
        )
      }
    }
  })
}
