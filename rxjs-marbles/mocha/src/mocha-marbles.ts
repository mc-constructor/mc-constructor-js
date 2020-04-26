import * as mocha from 'mocha'
import Suite = Mocha.Suite

import { AssertDeepEqualFn, MarblesHelpers, marblesTesting } from '../..'

export const mochaMarbles = (assertDeepEqual: AssertDeepEqualFn) => {
  MarblesHelpers.init(assertDeepEqual)

  const bdd = mocha.interfaces.bdd.bind(mocha.interfaces)
  mocha.interfaces.bdd = function marblesBddInterface(suite: Suite) {
    bdd(suite)
    const { EVENT_FILE_PRE_REQUIRE } = mocha.Suite.constants

    suite.on(EVENT_FILE_PRE_REQUIRE, function (context: any): void {

      function makeMarblesSuite(action: Function) {
        return function marblesSuite(title: string, fn: (helpers: MarblesHelpers) => void): void {
          action(title, function (this: Suite) {
            marblesTesting()
            fn.call(this, MarblesHelpers)
          })
        }
      }

      context.describe.marbles = makeMarblesSuite(context.describe)
      context.describe.marbles.only = makeMarblesSuite(context.describe.only)
      context.describe.marbles.skip = makeMarblesSuite(context.describe.skip)
      context.xdescribe.marbles = makeMarblesSuite(context.xdescribe)
    })
  }
}
