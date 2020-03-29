import { Observable, Subscriber, TeardownLogic } from 'rxjs'
import { share } from 'rxjs/operators'

export class SharedObservable<T> extends Observable<T> {
  constructor(subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) {
    super(o => {
      const inner$ = new Observable<T>(subscribe).pipe(share())
      const sub = inner$.subscribe(o)
      return sub.unsubscribe.bind(sub)
    })
  }
}
