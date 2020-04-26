import * as Chai from 'chai'
import { isObservable } from 'rxjs'

import { MarblesHelpers } from '../..'

export const chaiMarbles = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {
  utils.flag(utils, 'marbles', MarblesHelpers)

  utils.addMethod(chai.Assertion.prototype, 'subscribedWith', function (this: any, subscriptionMarbles: string) {
    const obj = utils.flag(this, 'object')
    const marbles = utils.flag(utils, 'marbles')
    marbles.expectSubscriptions(obj).toBe(subscriptionMarbles)
  })

  utils.addChainableMethod(chai.Assertion.prototype, 'subscription', function (this: any, subscriptionMarbles: string) {
    utils.flag(this, 'subscriptionMarbles', subscriptionMarbles)
  })

  utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (this: any, _super: any) {
    return function equal(this: any, expected: any) {
      const obj = utils.flag(this, 'object')
      if (isObservable(obj)) {
        const marbles = utils.flag(utils, 'marbles')
        const subscription = utils.flag(this, 'subscriptionMarbles')
        marbles.expectObservable(obj, subscription).toBe(expected)
        return
      }
      return _super.call(this, expected)
    }
  })

}
