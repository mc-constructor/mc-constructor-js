import { ModuleBuilder, Registerable } from '@dandi/core'

import { Client } from './client'
import { localToken } from './local-token'
import { ServerEventsProvider } from './server-events'
import { SocketClient } from './socket-client'

export class ServerModuleBuilder extends ModuleBuilder<ServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ServerModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerModule = new ServerModuleBuilder(
  { provide: Client, useClass: SocketClient },
  ServerEventsProvider,
)
