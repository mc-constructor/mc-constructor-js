import { Observable } from 'rxjs'
import { SubscriptionLog } from 'rxjs/internal/testing/SubscriptionLog'
import { TestScheduler } from 'rxjs/testing'

export interface AssertDeepEqualFn {
  (actual: any, expected: any): boolean | void
}

export interface MarblesHelpers {
  readonly cold: typeof TestScheduler.prototype.createColdObservable
  readonly expectObservable: typeof TestScheduler.prototype.expectObservable
  readonly expectSubscriptions: typeof TestScheduler.prototype.expectSubscriptions
  readonly hot: typeof TestScheduler.prototype.createHotObservable
}

export interface MarblesHelpersStatic extends MarblesHelpers {
  init(assertDeepEqual: AssertDeepEqualFn): void
  createTestScheduler(): TestScheduler
}

type MarblesHelpersInternal = { -readonly [TProp in keyof MarblesHelpers]: MarblesHelpers[TProp] }
const MarblesHelpersInternal: MarblesHelpersInternal = {} as MarblesHelpers

class MarblesHelpersImpl implements MarblesHelpersStatic {

  private assertDeepEqual: AssertDeepEqualFn

  public get cold(): typeof TestScheduler.prototype.createColdObservable {
    return (marbles: string): any => MarblesHelpersInternal.cold(marbles)
  }

  public get expectObservable(): typeof TestScheduler.prototype.expectObservable {
    return (stream: Observable<any>, subscriptionMarbles?: string) => MarblesHelpersInternal.expectObservable(stream, subscriptionMarbles)
  }

  public get expectSubscriptions(): typeof TestScheduler.prototype.expectSubscriptions {
    return (actualSubscriptionLogs: SubscriptionLog[]) => MarblesHelpersInternal.expectSubscriptions(actualSubscriptionLogs)
  }

  public get hot(): typeof TestScheduler.prototype.createHotObservable {
    return (marbles: string) => MarblesHelpersInternal.hot(marbles)
  }

  public init(assertDeepEqual: AssertDeepEqualFn): void {
    this.assertDeepEqual = assertDeepEqual
  }

  public createTestScheduler(): TestScheduler {
    return new TestScheduler(this.assertDeepEqual)
  }

}

export const MarblesHelpers: MarblesHelpersStatic = new MarblesHelpersImpl()

export function marblesTesting(): void {
  let scheduler: TestScheduler

  beforeEach(() => {
    scheduler = MarblesHelpers.createTestScheduler()
    const cold = scheduler.createColdObservable.bind(scheduler)
    const hot = scheduler.createHotObservable.bind(scheduler)
    const expectObservable = scheduler.expectObservable.bind(scheduler)
    const expectSubscriptions = scheduler.expectSubscriptions.bind(scheduler)
    Object.assign(MarblesHelpersInternal, {
      cold,
      expectObservable,
      expectSubscriptions,
      hot,
    })
  })
  afterEach(() => {
    scheduler = undefined
    delete MarblesHelpersInternal.cold
    delete MarblesHelpersInternal.expectObservable
    delete MarblesHelpersInternal.expectSubscriptions
    delete MarblesHelpersInternal.hot
  })

}
