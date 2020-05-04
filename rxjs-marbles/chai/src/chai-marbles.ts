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

  utils.addChainableMethod(chai.Assertion.prototype, 'originalContext', function (this: any, context: any) {
    utils.flag(this, 'originalContext', context)
  })

  utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (this: any, _super: any) {
    return function equal(this: any, expected: any) {
      const obj = utils.flag(this, 'object')
      const [marbles] = getContext()
      if (marbles && isObservable(obj) && typeof expected === 'string') {
        wrapLogSubscriptions(marbles.scheduler, obj)
        const subscription = utils.flag(this, 'subscriptionMarbles')
        const marbleValues = utils.flag(this, 'marbleValues')
        marbles.expectObservable(obj, subscription, this).toBe(expected, marbleValues)

        // gross hacky stuff to make the stack trace line up correctly
        const stackObj: any = {
          name: 'REPLACE_ME',
        }
        Error.captureStackTrace(stackObj, utils.flag(this, 'ssfi'))
        utils.flag(this, 'marblesStackObj', stackObj)
        return
      }
      const originalContext = utils.flag(this, 'originalContext')
      if (originalContext) {
        try {
          return _super.call(this, expected)
        } catch (err) {
          // even more gross hacky stuff to make the stack trace line up correctly
          const stackObj = utils.flag(originalContext, 'marblesStackObj')
          const [, ...stackLines] = stackObj.stack.split('\n')
          const [firstLine] = err.stack.split('\n')
          const realStack = [firstLine, ...stackLines].join('\n')
          Object.assign(err, {
            stack: realStack,
          })
          throw err
        }
      }
      return _super.call(this, expected)
    }
  })

}

export const assertDeepEqual = (actual: any, expected: any, context: any) => {
  expect(actual).with.originalContext(context).to.deep.equal(expected)
}
export const beforeEach = (helpers: MarblesHelpers, context: any): void => {
  util.flag(chaiMarbles, 'currentTest', context)
  util.flag(context, 'marblesHelpers', helpers)
}
export const afterEach = (): void => {
  util.flag(chaiMarbles, 'currentTest', undefined)
}
