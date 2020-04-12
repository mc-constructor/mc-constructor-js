import { ModuleBuilder, Registerable } from '@dandi/core'

import { Client } from './client'
import { localToken } from './local-token'
import { Players } from './players'
import { ServerEventsProvider } from './server-events'
import { SocketClient } from './socket-client'

export class ServerModuleBuilder extends ModuleBuilder<ServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ServerModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerModule = new ServerModuleBuilder(
  Players,
  { provide: Client, useClass: SocketClient },
  ServerEventsProvider,
)
