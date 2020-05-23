import { Observable, Subject } from 'rxjs'
import { SubscriptionLog } from 'rxjs/internal/testing/SubscriptionLog'

import { ContextualTestScheduler } from './contextual-test-scheduler'
import { MarbleKey, MarbleValues } from './types'

export interface AssertDeepEqualFn {
  (actual: any, expected: any, context?: any): boolean | void
}

export interface CreateHotObservable<T = MarbleKey> {
  (marbles: string, values?: MarbleValues<T>, error?: any): Subject<T>
}

export interface CreateColdObservable<T = MarbleKey> {
  (marbles: string, values?: MarbleValues<T>, error?: any): Subject<T>
}

export interface MarblesHelpers {
  readonly cold: CreateColdObservable
  readonly expectObservable: typeof ContextualTestScheduler.prototype.expectObservable
  readonly expectSubscriptions: typeof ContextualTestScheduler.prototype.expectSubscriptions
  readonly hot: CreateHotObservable
  readonly scheduler: ContextualTestScheduler
  readonly helpers: MarblesHelpers
}

export interface MarblesHelpersStatic extends MarblesHelpers {
  init(assertDeepEqual: AssertDeepEqualFn): void
  createTestScheduler(): ContextualTestScheduler
  run(fn: (helpers?: MarblesHelpers) => void): void
}

type MarblesHelpersInternal = { -readonly [TProp in keyof MarblesHelpers]: MarblesHelpers[TProp] } & { scheduler: ContextualTestScheduler }
const MarblesHelpersInternal: MarblesHelpersInternal = {} as any

class MarblesHelpersImpl implements MarblesHelpersStatic {

  private assertDeepEqual: AssertDeepEqualFn

  public get cold(): CreateColdObservable {
    return (marbles: string): any => MarblesHelpersInternal.cold(marbles)
  }

  public get expectObservable(): typeof ContextualTestScheduler.prototype.expectObservable {
    return (stream: Observable<any>, subscriptionMarbles?: string, context?: any) =>
      MarblesHelpersInternal.expectObservable(stream, subscriptionMarbles, context)
  }

  public get expectSubscriptions(): typeof ContextualTestScheduler.prototype.expectSubscriptions {
    return (actualSubscriptionLogs: SubscriptionLog[], context?: any) =>
      MarblesHelpersInternal.expectSubscriptions(actualSubscriptionLogs, context)
  }

  public get hot(): CreateHotObservable {
    return (marbles: string) => MarblesHelpersInternal.hot(marbles)
  }

  public get scheduler(): ContextualTestScheduler {
    return MarblesHelpersInternal.scheduler
  }

  public get helpers(): MarblesHelpers {
    return this
  }

  public init(assertDeepEqual: AssertDeepEqualFn): void {
    this.assertDeepEqual = assertDeepEqual
  }

  public createTestScheduler(): ContextualTestScheduler {
    return new ContextualTestScheduler(this.assertDeepEqual)
  }

  public run(fn: (helpers?: MarblesHelpers) => void): void {
    return MarblesHelpersInternal.scheduler.run(function(this: any) {
      return fn.call(this, MarblesHelpers)
    })
  }

}

export const MarblesHelpers: MarblesHelpersStatic = new MarblesHelpersImpl()

export function marblesTesting(): void {

  frameConsole(MarblesHelpersInternal)

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
      helpers: MarblesHelpersInternal,
    })
  })
  afterEach(() => {
    delete MarblesHelpersInternal.cold
    delete MarblesHelpersInternal.expectObservable
    delete MarblesHelpersInternal.expectSubscriptions
    delete MarblesHelpersInternal.hot
    delete MarblesHelpersInternal.scheduler
    delete MarblesHelpersInternal.helpers
  })

}

type LogMethods = Pick<Console, 'debug' | 'log' | 'warn' | 'info' | 'error' | 'trace'>

export function frameConsole(helpers: MarblesHelpers): void {

  const ogConsole: LogMethods = (() => {
    const { debug, log, warn, info, error, trace } = console
    return { debug, log, warn, info, error, trace }
  })()

  function initConsole(): void {
    Object.entries(ogConsole).forEach(([ name, fn ]) => {
      console[name as keyof LogMethods] = (...args: any[]) =>
        fn.call(console, `#${helpers.scheduler.frame}`, ...args)
    })
  }

  function resetConsole(): void {
    Object.entries(ogConsole).forEach(([ name, fn ]) => console[name as keyof LogMethods] = fn)
  }

  beforeEach(initConsole)
  afterEach(resetConsole)
}
