import { ServerEventDataTypes, ServerEventPatterns } from '../channels'
import { ServerChannel } from '../messages'

export enum ServerMainEventType {
  unknown = 'main:unknown',
}

export const SERVER_MAIN_PATTERNS: ServerEventPatterns<ServerChannel.main> = [
  [ServerMainEventType.unknown, /.*/],
]

export type ServerAuthenticatorEventDataTypeMap = {
  [ServerMainEventType.unknown]: any
}

// export type ServerMainEventDataTypes = {
//   [TEventType in ServerMainEventType]:
//     TEventType extends ServerMainEventType.unknown ?
//       any :
//       never
// }

export type ServerMainEventDataTypes = ServerEventDataTypes<ServerMainEventType, ServerAuthenticatorEventDataTypeMap>
