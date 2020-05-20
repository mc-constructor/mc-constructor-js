import { Observable } from 'rxjs'

import { Fixture } from './fixture'

export type ObservableServiceFixture<TService> = {
  [TProp in keyof Fixture<TService>]: Fixture<TService>[TProp] extends Observable<infer TItem> ? Observable<TItem> : Fixture<TService>[TProp]
}
