import { Injector, Provider } from '@dandi/core'

import { CodslapEvents } from './codslap-events'
import { Accessor, EventsAccessor } from './events-accessor'

export const EventsAccessorProvider: Provider<Accessor<CodslapEvents>> = {
  provide: EventsAccessor,
  useFactory(injector): Accessor<CodslapEvents> {
    return async (host: any, key: string) => {
      host[key] = (await injector.inject(CodslapEvents))?.singleValue
    }
  },
  deps: [Injector],
}
