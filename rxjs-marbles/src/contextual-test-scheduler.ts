import { AssertDeepEqualFn } from '@rxjs-marbles'
import { Observable } from 'rxjs'
import { SubscriptionLog } from 'rxjs/internal/testing/SubscriptionLog'
import { subscriptionLogsToBeFn } from 'rxjs/internal/testing/TestScheduler'
import { observableToBeFn } from 'rxjs/src/internal/testing/TestScheduler'
import { TestScheduler } from 'rxjs/testing'

interface ContextualFlushableTest {
  ready: boolean
  actual?: any[]
  expected?: any[]
  context?: any
}

export class ContextualTestScheduler extends TestScheduler {

  public assertDeepEqual: AssertDeepEqualFn

  constructor(assertDeepEqual: AssertDeepEqualFn) {
    super(assertDeepEqual)
  }

  public expectObservable(observable: Observable<any>,
                   subscriptionMarbles: string = null, context?: any): { toBe: observableToBeFn } {
    const superResult = super.expectObservable(observable, subscriptionMarbles)
    this.currentFlushTest.context = context
    return superResult
  }

  public expectSubscriptions(actualSubscriptionLogs: SubscriptionLog[], context?: any): { toBe: subscriptionLogsToBeFn } {
    const superResult = super.expectSubscriptions(actualSubscriptionLogs)
    this.currentFlushTest.context = context
    return superResult
  }

  public flush(): void {
    const flushTests = this.contextualFlushTests.slice(0)
    this.contextualFlushTests.length = 0
    super.flush()

    this.contextualFlushTests = flushTests.filter(test => {
      if (test.ready) {
        this.assertDeepEqual(test.actual, test.expected, test.context)
        return false
      }
      return true
    });

  }

  protected get contextualFlushTests(): ContextualFlushableTest[] {
    return (this as any).flushTests
  }

  protected set contextualFlushTests(flushTests: ContextualFlushableTest[]) {
    (this as any).flushTests = flushTests
  }

  protected get currentFlushTest(): ContextualFlushableTest {
    return this.contextualFlushTests[this.contextualFlushTests.length - 1]
  }
}
