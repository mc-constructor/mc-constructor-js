import { NetConnectOpts } from 'net'
import { TextEncoder } from 'util'

import { InjectionToken, Provider } from '@dandi/core'

import { localToken } from '../local-token'

const HOST_INDEX = process.argv.indexOf('--host')
const HOST = HOST_INDEX >= 0 ? process.argv[HOST_INDEX + 1] : undefined
const PORT_INDEX = process.argv.indexOf('--port')
const PORT = parseInt(process.argv[PORT_INDEX + 1], 10)

const encoder = new TextEncoder()
const DELIMITER = '------------------------------------------'
const DELIMITER_BUF = encoder.encode(DELIMITER)

export interface ClientMessageConfig {
  delimiter: string
  delimiterBuffer: Uint8Array
  encoder: TextEncoder
}

export interface SocketClientConfig {
  socket: NetConnectOpts
  message: ClientMessageConfig
}

export const SocketClientConfig: InjectionToken<SocketClientConfig> = localToken.opinionated('SocketConnectionConfig', {
  multi: false,
})

export const SocketClientConfigProvider: Provider<SocketClientConfig> = {
  provide: SocketClientConfig,
  useValue: {
    socket: {
      host: HOST,
      port: PORT,
    },
    message: {
      delimiter: DELIMITER,
      delimiterBuffer: DELIMITER_BUF,
      encoder,
    },
  },
}
