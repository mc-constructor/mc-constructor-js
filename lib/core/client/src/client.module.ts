import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import {
  RequestClientProvider,
  ResponseClientProvider,
  SocketClient,
  SocketClientConfigProvider,
  SocketConnectionProvider
} from './socket-client'

export class ClientModuleBuilder extends ModuleBuilder<ClientModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ClientModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ClientModule = new ClientModuleBuilder(
  RequestClientProvider,
  ResponseClientProvider,
  SocketClient,
  SocketClientConfigProvider,
  SocketConnectionProvider,
)
