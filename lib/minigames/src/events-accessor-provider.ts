import { Injector, Provider } from '@dandi/core'

import { Accessor, EventsAccessor } from './events-accessor'
import { MinigameEvents } from './minigame-events'

export const EventsAccessorProvider: Provider<Accessor<MinigameEvents>> = {
  provide: EventsAccessor,
  useFactory(injector): Accessor<MinigameEvents> {
    return async (host: any, key: string) => {
      host[key] = (await injector.inject(MinigameEvents))?.singleValue
    }
  },
  deps: [Injector],
}
