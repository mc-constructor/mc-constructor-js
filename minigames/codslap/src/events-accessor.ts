import { InjectionToken } from '@dandi/core'
import { CodslapEvents } from './codslap-events'
import { localToken } from './local-token'

export interface Accessor<T> {
  (host: any, key: string): void
}

export const EventsAccessor: InjectionToken<Accessor<CodslapEvents>> = localToken.opinionated('EventsAccessor', {
  multi: false,
})
