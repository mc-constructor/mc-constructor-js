import { ServerEventDataTypes, ServerEventPatterns } from '../channels'
import { ServerChannel } from '../messages'

export enum ServerAuthenticatorEventType {
  playerLogin = 'playerLogin', // {player}[/{ip:port}] logged in with entity id {id} at ({location})
}

export const SERVER_AUTHENTICATOR_PATTERNS: ServerEventPatterns<ServerChannel.authenticator> = [
  [ServerAuthenticatorEventType.playerLogin, /^UUID of player (?<player>\w+) is (?<uuid>[\da-f\-]+)$/],
]

export interface PlayerAuthenticationEventData {
  player: string
  uuid: string
}

export type ServerAuthenticatorEventDataTypeMap = {
  [ServerAuthenticatorEventType.playerLogin]: PlayerAuthenticationEventData,
}


// export type ServerAuthenticatorEventDataTypes = {
//   [TEventType in ServerAuthenticatorEventType]: ServerAuthenticatorEventDataTypeMap[TEventType]
// }

export type ServerAuthenticatorEventDataTypes = ServerEventDataTypes<ServerAuthenticatorEventType, ServerAuthenticatorEventDataTypeMap>
