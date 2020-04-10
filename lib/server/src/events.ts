import { Uuid } from '@dandi/common'
import { InjectionToken, Provider } from '@dandi/core'
import { Observable, OperatorFunction } from 'rxjs'
import { filter, map, share, tap } from 'rxjs/operators'

import { Item } from '../../types'

import { Client } from './client'
import { localToken } from './local-token'
import { Player } from './players'

export enum ServerEventType {
  entityLivingDeath = 'net.minecraftforge.event.entity.living.LivingDeathEvent',
  entityLivingAttack = 'net.minecraftforge.event.entity.living.LivingAttackEvent',
  entityLivingDamage = 'net.minecraftforge.event.entity.living.LivingDamageEvent',
  entityLivingFall = 'net.minecraftforge.event.entity.living.LivingFallEvent',
  playerAttackEntity = 'net.minecraftforge.event.entity.player.AttackEntityEvent',
  playerEntityItemPickup = 'net.minecraftforge.event.entity.player.EntityItemPickupEvent',
  playerLeftClickBlock = 'net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickBlock',
  playerLeftClickEmpty = 'net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickEmpty',
  playerItemPickup = 'net.minecraftforge.event.entity.player.PlayerEvent$ItemPickupEvent',
  playerJoined = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent',
  playerLeft = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerLoggedOutEvent',
  playerRespawn = 'net.minecraftforge.event.entity.player.PlayerEvent$PlayerRespawnEvent',
}

export interface ServerEvent {
  messageId: Uuid
  type: ServerEventType
  extras: string[]
}

export interface HeldItem {
  item: Item
  itemName?: string
}

export interface PlayerWithHeldItems extends Player {
  mainHand: HeldItem
  offHand: HeldItem
}

export interface EntityEvent extends ServerEvent {
  entityId: string
}

export interface PlayerEvent extends ServerEvent {
  player: PlayerWithHeldItems
}

function parseMessage([messageId, [type, ...extras]]): ServerEvent {
  return { messageId, type, extras }
}

function parseHeldItem(raw: string): HeldItem {
  const [itemRaw, itemName] = raw.split('|')
  const item = itemRaw as Item
  return {
    item,
    itemName,
  }
}

function parsePlayerEvent(event: ServerEvent): PlayerEvent {
  const [playerRaw, mainHandRaw, offHandRaw, ...extras] = event.extras
  const [name, uuidRaw] = playerRaw.split(' ')
  const uuid = Uuid.for(uuidRaw.substring(1, uuidRaw.length - 1))
  const mainHand: HeldItem = parseHeldItem(mainHandRaw)
  const offHand: HeldItem = parseHeldItem(offHandRaw)
  const player: PlayerWithHeldItems = {
    name,
    uuid,
    mainHand,
    offHand
  }
  return Object.assign(event, {
    player,
    extras,
  })
}

function parseEntityEvent(event: ServerEvent): EntityEvent {
  const [entityId] = event.extras
  return Object.assign(event, {
    entityId,
  })
}

type ServerEventParserFn<TEvent extends ServerEvent> = (event: ServerEvent) => TEvent
type ServerEventTypes = {
  [ServerEventType.entityLivingDeath]: EntityEvent
  [ServerEventType.entityLivingAttack]: EntityEvent
  [ServerEventType.entityLivingDamage]: EntityEvent
  [ServerEventType.entityLivingFall]: EntityEvent
  [ServerEventType.playerAttackEntity]: PlayerEvent
  [ServerEventType.playerEntityItemPickup]: PlayerEvent
  [ServerEventType.playerLeftClickBlock]: PlayerEvent
  [ServerEventType.playerLeftClickEmpty]: PlayerEvent
  [ServerEventType.playerItemPickup]: PlayerEvent
  [ServerEventType.playerJoined]: PlayerEvent
  [ServerEventType.playerLeft]: PlayerEvent
  [ServerEventType.playerRespawn]: PlayerEvent
}
type ServerEventParserMap = { [TEventType in ServerEventType]: ServerEventParserFn<ServerEventTypes[TEventType]> }

const PARSERS: ServerEventParserMap = {
  [ServerEventType.entityLivingDeath]: parseEntityEvent,
  [ServerEventType.entityLivingAttack]: parseEntityEvent,
  [ServerEventType.entityLivingDamage]: parseEntityEvent,
  [ServerEventType.entityLivingFall]: parseEntityEvent,
  [ServerEventType.playerAttackEntity]: parsePlayerEvent,
  [ServerEventType.playerEntityItemPickup]: parsePlayerEvent,
  [ServerEventType.playerLeftClickBlock]: parsePlayerEvent,
  [ServerEventType.playerLeftClickEmpty]: parsePlayerEvent,
  [ServerEventType.playerItemPickup]: parsePlayerEvent,
  [ServerEventType.playerRespawn]: parsePlayerEvent,
  [ServerEventType.playerJoined]: parsePlayerEvent,
  [ServerEventType.playerLeft]: parsePlayerEvent,
}

export function isEventType<TEvent extends ServerEventType>(type: TEvent, event: ServerEvent): event is ServerEventTypes[TEvent] {
  return event.type === type
}

export function eventType<TEvent extends ServerEventType>(type: TEvent): OperatorFunction<ServerEvent, ServerEventTypes[TEvent]> {
  return filter<ServerEvent, ServerEventTypes[TEvent]>(isEventType.bind(undefined, type))
}

export type ServerEvents = Observable<ServerEvent>
export const ServerEvents: InjectionToken<ServerEvents> = localToken.opinionated<ServerEvents>('ServerEvents', {
  multi: false,
})

export const ServerEventsProvider: Provider<ServerEvents> = {
  provide: ServerEvents,
  useFactory(client: Client): ServerEvents {
    return client.messages$
      .pipe(
        map(parseMessage),
        filter(event => {
          if (PARSERS[event.type]) {
            return true
          }
          console.warn(`No parser for ${event.type}`, event)
          return false
        }),
        map(event => PARSERS[event.type](event)),
        tap(event => {
          if (event.type !== ServerEventType.entityLivingAttack && event.type !== ServerEventType.entityLivingDamage) {
            console.debug.bind(console, 'event:')
          }
        }),
        share(),
      )
  },
  deps: [Client],
}
