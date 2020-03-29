import { ServerEventDataTypes, ServerEventPatterns } from '../channels'
import { ServerChannel } from '../messages'

export enum ServerThreadEventType {
  playerChat = 'playerChat', // <{player}> {message}
  playerEmote = 'playerEmote', // * {player} {action}
  playerDied = 'playerDied', // {player} fell from a high place
  playerJoin = 'playerJoin', // {player} joined the game
  playerKilled = 'playerKilled', // {player} was {action} by {killer}
  playerLeft = 'playerLeft', // {player} left the game
  playerLogin = 'playerLogin', // {trexarming}[/{ip}:{port}] logged in with entity id {entityId} at ({location})
}

export const SERVER_THREAD_PATTERNS: ServerEventPatterns<ServerChannel.thread> = [
  [ServerThreadEventType.playerChat, /^<(?<player>\w+)> (?<message>.+)$/],
  [ServerThreadEventType.playerEmote, /^\* (?<player>\w+) (?<action>.+)$/],
  [ServerThreadEventType.playerDied, /^(?<player>\w+) (?<reason>(fell from a high place|tried to swim in lava))$/],
  [ServerThreadEventType.playerJoin, /^(?<player>\w+) joined the game$/],
  [ServerThreadEventType.playerKilled, [
    /^(?<player>\w+) was (?<action>[\w\s]+) by (?<killer>\w+)( using \[?(?<weapon>.+?)]?)?$/,
    /^(?<player>\w+) (?<action>[\w\s]+) whilst fighting (?<killer>\w+)$/,
    /^(?<player>\w+) (?<action>[\w\s]+) to escape (?<killer>\w+)$/,
  ]],
  [ServerThreadEventType.playerLeft, [
    /^(?<player>\w+) left the game$/,
    /^(?<player>\w+) lost connection: (?<reason>[\w\s]+)$/,
  ]],
  [ServerThreadEventType.playerLogin, /^(?<player>\w+)\[\/(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{3,5})] logged in with entity id (?<entityId>\d+) at \((?<locX>-?\d+\.\d+), (?<locY>-?\d+\.\d+), (?<locZ>-?\d+\.\d+)\)$/]
]

export interface PlayerEventData {
  player: string
}

export interface PlayerKilledEventData extends PlayerEventData {
  action: string
  killer: string
  weapon?: string
}

export interface PlayerLoginEventData extends PlayerEventData {
  player: string
  ip: string
  entityId: string
  locX: string
  locY: string
  locZ: string
}

export interface PlayerChatEventData extends PlayerEventData {
  message: string
}

export interface PlayerEmoteEventData extends PlayerEventData {
  action: string
}

type ServerThreadEventDataTypeMap = {
  [ServerThreadEventType.playerChat]: PlayerChatEventData,
  [ServerThreadEventType.playerEmote]: PlayerEmoteEventData,
  [ServerThreadEventType.playerDied]: PlayerEventData,
  [ServerThreadEventType.playerJoin]: PlayerEventData,
  [ServerThreadEventType.playerKilled]: PlayerKilledEventData,
  [ServerThreadEventType.playerLeft]: PlayerEventData,
  [ServerThreadEventType.playerLogin]: PlayerLoginEventData,
}

export type ServerThreadEventDataTypes = ServerEventDataTypes<ServerThreadEventType, ServerThreadEventDataTypeMap>
