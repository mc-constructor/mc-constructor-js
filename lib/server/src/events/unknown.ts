import { ServerEventDataTypes, ServerEventPatterns } from '../channels'
import { ServerChannel } from '../messages'

export enum ServerUnknownEventType {
  unknown = 'unknown:unknown',
}

export const SERVER_UNKNOWN_PATTERNS: ServerEventPatterns<ServerChannel.unknown> = [
  [ServerUnknownEventType.unknown, /.*/],
]

// export type ServerUnknownEventDataTypes = {
//   [TEventType in ServerUnknownEventType]:
//     TEventType extends ServerUnknownEventType.unknown ?
//       any :
//       never
// }

export type ServerUnknownEventDataTypeMap = {
  [ServerUnknownEventType.unknown]: any
}

export type ServerUnknownEventDataTypes = ServerEventDataTypes<ServerUnknownEventType, ServerUnknownEventDataTypeMap>
