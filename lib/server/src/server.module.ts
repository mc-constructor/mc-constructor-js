import { ModuleBuilder, Registerable } from '@dandi/core'

import { ServerEvents } from './events'
import { localToken } from './local-token'
// import { ServerMessages } from './messages'
import { Players } from './players'
import { Client } from './client'

export class ServerModuleBuilder extends ModuleBuilder<ServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ServerModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerModule = new ServerModuleBuilder(
  Players,
  Client,
  ServerEvents,
  // ServerMessages,
)
