import { ServerEventDataTypes, ServerEventPatterns } from '../channels'
import { ServerChannel } from '../messages'

export enum ServerWorkerEventType {
  unknown = 'worker:unknown',
}

export const SERVER_WORKER_PATTERNS: ServerEventPatterns<ServerChannel.worker> = [
  [ServerWorkerEventType.unknown, /.*/],
]

// export type ServerWorkerEventDataTypes = {
//   [TEventType in ServerWorkerEventType]:
//     TEventType extends ServerWorkerEventType.unknown ?
//       any :
//       never
// }

export type ServerWorkerEventDataTypeMap = {
  [ServerWorkerEventType.unknown]: any
}

export type ServerWorkerEventDataTypes = ServerEventDataTypes<ServerWorkerEventType, ServerWorkerEventDataTypeMap>
