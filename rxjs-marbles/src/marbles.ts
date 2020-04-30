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
  readonly scheduler: TestScheduler
}

export interface MarblesHelpersStatic extends MarblesHelpers {
  init(assertDeepEqual: AssertDeepEqualFn): void
  createTestScheduler(): TestScheduler
  run(fn: (helpers?: MarblesHelpers) => void): void
}

type MarblesHelpersInternal = { -readonly [TProp in keyof MarblesHelpers]: MarblesHelpers[TProp] } & { scheduler: TestScheduler }
const MarblesHelpersInternal: MarblesHelpersInternal = {} as any

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

  public get scheduler(): TestScheduler {
    return MarblesHelpersInternal.scheduler
  }

  public init(assertDeepEqual: AssertDeepEqualFn): void {
    this.assertDeepEqual = assertDeepEqual
  }

  public createTestScheduler(): TestScheduler {
    return new TestScheduler(this.assertDeepEqual)
  }

  public run(fn: (helpers?: MarblesHelpers) => void): void {
    return MarblesHelpersInternal.scheduler.run(function(this: any) {
      return fn.call(this, MarblesHelpers)
    })
  }

}

export const MarblesHelpers: MarblesHelpersStatic = new MarblesHelpersImpl()

export function marblesTesting(): void {

  beforeEach(() => {
    const scheduler = MarblesHelpers.createTestScheduler()
    const cold = scheduler.createColdObservable.bind(scheduler)
    const hot = scheduler.createHotObservable.bind(scheduler)
    const expectObservable = scheduler.expectObservable.bind(scheduler)
    const expectSubscriptions = scheduler.expectSubscriptions.bind(scheduler)
    Object.assign(MarblesHelpersInternal, {
      cold,
      expectObservable,
      expectSubscriptions,
      hot,
      scheduler,
    })
  })
  afterEach(() => {
    delete MarblesHelpersInternal.cold
    delete MarblesHelpersInternal.expectObservable
    delete MarblesHelpersInternal.expectSubscriptions
    delete MarblesHelpersInternal.hot
    delete MarblesHelpersInternal.scheduler
  })

}
