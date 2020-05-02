import * as Chai from 'chai'
import { expect, util } from 'chai'
import { isObservable } from 'rxjs'

import { MarblesHelpers, wrapLogSubscriptions } from '../..'

export const chaiMarbles = (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) => {

  function getContext(): [MarblesHelpers, any] {
    const context = utils.flag(chaiMarbles, 'currentTest')
    const marbles: MarblesHelpers = context ? utils.flag(context, 'marblesHelpers') : undefined
    return [marbles, context]
  }

  utils.addMethod(chai.Assertion.prototype, 'subscribedWith', function (this: any, ...subscriptionMarbles: string[]) {
    const obj = utils.flag(this, 'object')
    const [marbles] = getContext()
    if (isObservable(obj)) {
      marbles.expectSubscriptions(wrapLogSubscriptions(marbles.scheduler, obj).subscriptions).toBe(subscriptionMarbles)
    }
  })

  utils.addMethod(chai.Assertion.prototype, 'marbleValues', function (this: any, values: any) {
    utils.flag(this, 'marbleValues', values)
  })

  utils.addChainableMethod(chai.Assertion.prototype, 'subscription', function (this: any, subscriptionMarbles: string) {
    utils.flag(this, 'subscriptionMarbles', subscriptionMarbles)
  })

  utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (this: any, _super: any) {
    return function equal(this: any, expected: any) {
      const obj = utils.flag(this, 'object')
      const [marbles] = getContext()
      if (marbles && isObservable(obj) && typeof expected === 'string') {
        wrapLogSubscriptions(marbles.scheduler, obj)
        const subscription = utils.flag(this, 'subscriptionMarbles')
        const marbleValues = utils.flag(this, 'marbleValues')
        marbles.expectObservable(obj, subscription).toBe(expected, marbleValues)
        return
      }
      return _super.call(this, expected)
    }
  })

}

export const assertDeepEqual = (actual: any, expected: any) => expect(actual).to.deep.equal(expected)
export const beforeEach = (helpers: MarblesHelpers, context: any): void => {
  util.flag(chaiMarbles, 'currentTest', context)
  util.flag(context, 'marblesHelpers', helpers)
}
export const afterEach = (): void => {
  util.flag(chaiMarbles, 'currentTest', undefined)
}
