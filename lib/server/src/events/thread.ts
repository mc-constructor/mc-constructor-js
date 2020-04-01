import { ServerEventDataTypes, ServerEventPatterns } from '../channels'
import { ServerChannel } from '../messages'

export enum ServerThreadEventType {
  entitiesKilled = 'entitiesKilled', // Killed 16 entities
  entitySummoned = 'entitySummoned', // Summoned new Sheep

  /**
   * logged after attempting to use "give" command with a selector that does not match any player
   */
  noPlayerFound = 'noPlayerFound', // No player was found
  playerChat = 'playerChat', // <{player}> {message}
  playerDied = 'playerDied', // {player} fell from a high place
  playerEmote = 'playerEmote', // * {player} {action}
  playerGivenItems = 'playerGivenItems', // Gave {player} {count} [{item}]
  playerJoin = 'playerJoin', // {player} joined the game
  playerKilled = 'playerKilled', // {player} was {action} by {killer}
  playerLeft = 'playerLeft', // {player} left the game
  playerLogin = 'playerLogin', // {trexarming}[/{ip}:{port}] logged in with entity id {entityId} at ({location})
  playerSlotReplaced = 'playerSlotReplaced', // Replaced a slot on snootboopers with [Raw Cod]
  playerTeleported = 'playerTeleported', // Teleported snootboopers to -4.5, 127.0, 7.5
  // setPlayerSpawnPoint = 'setPlayerSpawnPoint', // Set spawn point to -6, 127, 5 for snootboopers
  tooManyBlocks = 'tooManyBlocks', // Too many blocks in the specified area (maximum 32768, specified 36663)
}

export const SERVER_THREAD_PATTERNS: ServerEventPatterns<ServerChannel.thread> = [
  [ServerThreadEventType.entitiesKilled, /^Killed (?<count>)\d+ entities$/],
  [ServerThreadEventType.entitySummoned, /^Summoned new (?<entity>[\w\s]+)$/],
  [ServerThreadEventType.noPlayerFound, /^No player was found$/],
  [ServerThreadEventType.playerChat, /^<(?<player>\w+)> (?<message>.+)$/],
  [ServerThreadEventType.playerDied, /^(?<player>\w+) (?<reason>(fell from a high place|tried to swim in lava))$/],
  [ServerThreadEventType.playerEmote, /^\* (?<player>\w+) (?<action>.+)$/],
  [ServerThreadEventType.playerGivenItems, /^Gave (?<count>\d+) \[(?<item>[\w\s]+)] to (?<player>\w+)$/],
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
  [ServerThreadEventType.playerLogin, /^(?<player>\w+)\[\/(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{3,5})] logged in with entity id (?<entityId>\d+) at \((?<locX>-?\d+\.\d+), (?<locY>-?\d+\.\d+), (?<locZ>-?\d+\.\d+)\)$/],
  [ServerThreadEventType.playerSlotReplaced, /^Replaced a slot on (?<player>\w+) with \[(?<item>[\w\s]+)]$/],
  [ServerThreadEventType.playerTeleported, [
    /^Teleported (?<player>\w+) to (?<locX>-?\d+\.\d+), (?<locY>-?\d+\.\d+), (?<locZ>-?\d+\.\d+)$/,
    /^Teleported (?<player>\w+) to (?<target>[\w\s]+)$/,
  ]],
  // [ServerThreadEventType.setPlayerSpawnPoint, /^]
  [ServerThreadEventType.tooManyBlocks, /^Too many blocks in the specified area \(maximum \d+, specified (?<specified>\d+)\)$/],
]

export interface PlayerEventData {
  player: string
}

export interface PlayerKilledEventData extends PlayerEventData {
  action: string
  killer: string
  weapon?: string
}

export interface PlayerLocationEventData extends PlayerEventData {
  locX: string
  locY: string
  locZ: string
}

export interface PlayerTeleportEventData extends Partial<PlayerLoginEventData> {
  player: string
  target?: string
}

export interface PlayerLoginEventData extends PlayerLocationEventData {
  player: string
  ip: string
  entityId: string
}

export interface PlayerChatEventData extends PlayerEventData {
  message: string
}

export interface PlayerEmoteEventData extends PlayerEventData {
  action: string
}

export interface PlayerItemEvent extends PlayerEventData {
  item: string
  count?: string
}

export interface EntitySummonedEventData {
  entity: string
}

export interface EntitiesKilledEventData {
  count: string
}

type ServerThreadEventDataTypeMap = {
  [ServerThreadEventType.entitiesKilled]: EntitiesKilledEventData,
  [ServerThreadEventType.entitySummoned]: EntitySummonedEventData,
  [ServerThreadEventType.noPlayerFound]: {},
  [ServerThreadEventType.playerChat]: PlayerChatEventData,
  [ServerThreadEventType.playerDied]: PlayerEventData,
  [ServerThreadEventType.playerEmote]: PlayerEmoteEventData,
  [ServerThreadEventType.playerGivenItems]: PlayerItemEvent,
  [ServerThreadEventType.playerJoin]: PlayerEventData,
  [ServerThreadEventType.playerKilled]: PlayerKilledEventData,
  [ServerThreadEventType.playerLeft]: PlayerEventData,
  [ServerThreadEventType.playerLogin]: PlayerLoginEventData,
  [ServerThreadEventType.playerSlotReplaced]: PlayerItemEvent,
  [ServerThreadEventType.playerTeleported]: PlayerTeleportEventData,
  [ServerThreadEventType.tooManyBlocks]: {}
}

export type ServerThreadEventDataTypes = ServerEventDataTypes<ServerThreadEventType, ServerThreadEventDataTypeMap>
