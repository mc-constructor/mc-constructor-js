import { isObservable, Observable, Operator, Subscriber, TeardownLogic, UnaryFunction } from 'rxjs'
import { SubscriptionLog } from 'rxjs/internal/testing/SubscriptionLog'
import { TestScheduler } from 'rxjs/testing'

export type SubscriptionLoggedObservable<T> = Observable<T> & { subscriptions: SubscriptionLog[] }

export function isSubscriptionLoggedObservable<T>(obj: any): obj is SubscriptionLoggedObservable<T> {
  return obj?.hasOwnProperty('subscriptions') && Array.isArray(obj.subscriptions) && isObservable(obj)
}

export function wrapLogSubscriptions<T>(scheduler: TestScheduler, source: Observable<T>): SubscriptionLoggedObservable<T> {
  if (isSubscriptionLoggedObservable(source)) {
    return source
  }
  return logSubscriptions<T>(scheduler)(source)
}

export type LogSubscriptionsOperatorFunction<T> = UnaryFunction<Observable<T>, SubscriptionLoggedObservable<T>>

export function logSubscriptions<T>(scheduler: TestScheduler): LogSubscriptionsOperatorFunction<T> {
  return (source: Observable<T>) => new LogSubscriptionsOperator<T>(scheduler).apply(source)
}

class LogSubscriptionsOperator<T> implements Operator<T, T> {

  private subscriptions: SubscriptionLog[]

  constructor(
    private readonly scheduler: TestScheduler,
  ) {
  }

  public apply(source: Observable<T>): SubscriptionLoggedObservable<T> {
    if (isSubscriptionLoggedObservable(source)) {
      return source
    }
    return Object.assign(source.lift(this), {
      subscriptions: this.subscriptions,
    })
  }

  public call(subscriber: Subscriber<T>, source: any): TeardownLogic {
    const logEntry = new SubscriptionLog(this.scheduler.frame)
    this.subscriptions.push(logEntry)
    return source.subscribe(new LogSubscriptionsSubscriber(this.scheduler, subscriber, logEntry));
  }
}

class LogSubscriptionsSubscriber<T> extends Subscriber<T> {
  constructor(
    private readonly scheduler: TestScheduler,
    destination: Subscriber<T>,
    private readonly logEntry: SubscriptionLog,
  ) {
    super(destination)
  }

  public unsubscribe(): void {
    super.unsubscribe()
    this.logEntry.unsubscribedFrame = this.scheduler.frame
  }
}
