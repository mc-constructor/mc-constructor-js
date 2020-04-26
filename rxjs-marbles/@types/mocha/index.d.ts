import { MarblesHelpers } from '@rxjs-marbles'

declare global {
  export namespace Mocha {

    interface ExclusiveMarblesSuiteFunction {
      (title: string): Suite
      (title: string, fn: (this: Suite, helpers?: MarblesHelpers) => void): Suite
    }

    interface PendingMarblesSuiteFunction {
      (title: string, fn: (this: Suite, helpers?: MarblesHelpers) => void): Suite
    }

    interface MarblesSuiteFunction {
      (title: string): Suite
      (title: string, fn: (this: Suite, helpers?: MarblesHelpers) => void): Suite
      only: ExclusiveMarblesSuiteFunction
      skip: PendingMarblesSuiteFunction
    }

    interface SuiteFunction {
      marbles: MarblesSuiteFunction
    }
  }
}
