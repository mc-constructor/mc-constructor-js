import { Observable } from 'rxjs'

export type ObservableServiceFixture<TService> = {
  [TProp in keyof TService]: TService[TProp] extends Observable<infer TItem> ? Observable<TItem> : TService[TProp]
}
