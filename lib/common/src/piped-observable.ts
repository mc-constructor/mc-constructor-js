import { Observable, OperatorFunction, Subscriber, TeardownLogic } from 'rxjs'
import { share } from 'rxjs/operators'

export abstract class PipedObservable<T> extends Observable<T> {
  protected constructor(subscribe: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic,  ...operations: OperatorFunction<any, any>[]) {
    super(o => {
      let inner$ = operations
        .reduce((inner$, op) => inner$.pipe(op),
          new Observable<T>(subscribe)
        )
      const sub = inner$.subscribe(o)
      return sub.unsubscribe.bind(sub)
    })
  }
}

export abstract class SharedObservable<T> extends PipedObservable<T> {
  protected constructor(subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) {
    super(subscribe, share())
  }
}
