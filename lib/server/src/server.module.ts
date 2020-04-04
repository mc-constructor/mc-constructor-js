import { ModuleBuilder, Registerable } from '@dandi/core'

// import { Director } from './director'
// import { ServerEvents } from './events'
import { localToken } from './local-token'
// import { ServerMessages } from './messages'
import { PlayersProvider, PlayersService } from './players'
import { Client } from './client'

export class ServerModuleBuilder extends ModuleBuilder<ServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ServerModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerModule = new ServerModuleBuilder(
  // Director,
  PlayersService,
  PlayersProvider,
  Client,
  // ServerEvents,
  // ServerMessages,
)
