import { ModuleBuilder, Registerable } from '@dandi/core'

import { Client } from './client'
import { ServerEventsProvider } from './events'
import { localToken } from './local-token'
import { Players } from './players'

export class ServerModuleBuilder extends ModuleBuilder<ServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ServerModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ServerModule = new ServerModuleBuilder(
  Players,
  Client,
  ServerEventsProvider,
)
