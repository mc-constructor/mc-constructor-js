import * as mocha from 'mocha'
import Suite = Mocha.Suite

import { AssertDeepEqualFn, MarblesHelpers, marblesTesting } from '../..'

export interface TestHookFn {
  (helpers: MarblesHelpers, context: any): void
}

export interface MochaMarblesConfig {
  assertDeepEqual: AssertDeepEqualFn
  beforeEach?: TestHookFn
  afterEach?: TestHookFn
}

export const mochaMarbles = (config: MochaMarblesConfig) => {
  MarblesHelpers.init(config.assertDeepEqual)

  const bdd = mocha.interfaces.bdd.bind(mocha.interfaces)
  mocha.interfaces.bdd = function marblesBddInterface(suite: Suite) {
    bdd(suite)
    const { EVENT_FILE_PRE_REQUIRE } = mocha.Suite.constants

    suite.on(EVENT_FILE_PRE_REQUIRE, function (context: any): void {

      function makeMarblesSuite(context: any, action: Function): Function {

        function makeMarblesTest(test: Function): Function {
          return function marblesTest(title: string, fn: (helpers: MarblesHelpers) => void): void {
            if (typeof fn === 'function') {
              return test(title, function (this: any) {
                if (typeof config.beforeEach === 'function') {
                  config.beforeEach(MarblesHelpers, this)
                }
                const returnValue = MarblesHelpers.run((helpers) => {
                  fn.call(this, helpers)
                })
                if (typeof config.afterEach === 'function') {
                  config.afterEach(MarblesHelpers, this)
                }
                return returnValue
              })
            }
            return test(title, fn)
          }
        }

        return function marblesSuite(this: any, title: string, fn: (helpers: MarblesHelpers) => void): void {

          const { it, xit } = context
          context.it = makeMarblesTest(it)
          context.it.only = makeMarblesTest(it.only)
          context.it.skip = makeMarblesTest(it.skip)
          context.it.noMarbles = it
          context.xit = makeMarblesTest(xit)
          context.xit.noMarbles = xit

          return action(title, function (this: Suite) {
            marblesTesting()
            return fn.call(this, MarblesHelpers)
          })
        }
      }

      context.describe.marbles = makeMarblesSuite(context, context.describe)
      context.describe.marbles.only = makeMarblesSuite(context, context.describe.only)
      context.describe.marbles.skip = makeMarblesSuite(context, context.describe.skip)
      context.xdescribe.marbles = makeMarblesSuite(context, context.xdescribe)

    })
  }
}
