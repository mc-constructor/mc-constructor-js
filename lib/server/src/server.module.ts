import { ModuleBuilder, Registerable } from '@dandi/core'

import { Director } from './director'
import { ServerEvents } from './events'
import { localToken } from './local-token'
import { ServerMessages } from './messages'
import { Players } from './players'
import { ClientProvider, Server } from './server'

export class ServerModuleBuilder extends ModuleBuilder<ServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ServerModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerModule = new ServerModuleBuilder(
  ClientProvider,
  Director,
  Players,
  Server,
  ServerEvents,
  ServerMessages,
)
