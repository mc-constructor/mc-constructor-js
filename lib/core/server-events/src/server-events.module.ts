import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { ServerEventsProvider } from './server-events'

class EventsModuleBuilder extends ModuleBuilder<EventsModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(EventsModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerEventsModule = new EventsModuleBuilder(
  ServerEventsProvider,
)
