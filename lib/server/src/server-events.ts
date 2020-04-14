import { InjectionToken, Provider } from '@dandi/core'
import { Observable, OperatorFunction } from 'rxjs'
import { filter, map, share, tap } from 'rxjs/operators'

import { Client } from './client'
import {
  AttackedEntityEvent,
  AttackerType,
  EntityEvent,
  MinigameStartEvent,
  PlayerEvent,
  ServerEventType,
} from './event'
import {
  AttackedByEntityEventType,
  parseAttackedEntityEvent,
  parseEntityEvent
} from './event/entity'
import { parseMinigameStartEvent } from './event/minigame'
import { parsePlayerEvent } from './event/player-event'
import { parseMessage, ServerEvent } from './event/server-event'
import { localToken } from './local-token'

type ServerEventParserFn<TEvent extends ServerEvent> = (event: ServerEvent) => TEvent
type ServerEventTypes = {
  [ServerEventType.entityLivingDeath]: AttackedEntityEvent
  [ServerEventType.entityLivingAttack]: AttackedEntityEvent
  [ServerEventType.entityLivingDamage]: AttackedEntityEvent
  [ServerEventType.entityLivingFall]: EntityEvent
  [ServerEventType.playerAttackEntity]: PlayerEvent
  [ServerEventType.playerEntityItemPickup]: PlayerEvent
  [ServerEventType.playerLeftClickBlock]: PlayerEvent
  [ServerEventType.playerLeftClickEmpty]: PlayerEvent
  [ServerEventType.playerItemPickup]: PlayerEvent
  [ServerEventType.playerJoined]: PlayerEvent
  [ServerEventType.playerLeft]: PlayerEvent
  [ServerEventType.playerRespawn]: PlayerEvent

  [ServerEventType.minigameStart]: MinigameStartEvent
}
type ServerEventParserMap = { [TEventType in ServerEventType]: ServerEventParserFn<ServerEventTypes[TEventType]> }

const PARSERS: ServerEventParserMap = {
  [ServerEventType.entityLivingDeath]: parseAttackedEntityEvent,
  [ServerEventType.entityLivingAttack]: parseAttackedEntityEvent,
  [ServerEventType.entityLivingDamage]: parseAttackedEntityEvent,
  [ServerEventType.entityLivingFall]: parseEntityEvent,
  [ServerEventType.playerAttackEntity]: parsePlayerEvent,
  [ServerEventType.playerEntityItemPickup]: parsePlayerEvent,
  [ServerEventType.playerLeftClickBlock]: parsePlayerEvent,
  [ServerEventType.playerLeftClickEmpty]: parsePlayerEvent,
  [ServerEventType.playerItemPickup]: parsePlayerEvent,
  [ServerEventType.playerRespawn]: parsePlayerEvent,
  [ServerEventType.playerJoined]: parsePlayerEvent,
  [ServerEventType.playerLeft]: parsePlayerEvent,

  [ServerEventType.minigameStart]: parseMinigameStartEvent,
}

export function isEventType<TEvent extends ServerEventType>(type: TEvent, event: ServerEvent): event is ServerEventTypes[TEvent] {
  return event.type === type
}

export function eventType<TEvent extends ServerEventType>(type: TEvent): OperatorFunction<ServerEvent, ServerEventTypes[TEvent]> {
  return filter<ServerEvent, ServerEventTypes[TEvent]>(isEventType.bind(undefined, type))
}

export function isAttackerTypeEvent<TAttackerType extends AttackerType>(attackerType: TAttackerType, event: AttackedEntityEvent): event is AttackedByEntityEventType[TAttackerType] {
  return event.attackerType === attackerType
}

export function entityAttackerType<TAttackerType extends AttackerType>(attackerType: TAttackerType): OperatorFunction<AttackedEntityEvent, AttackedByEntityEventType[TAttackerType]> {
  return filter<AttackedEntityEvent, AttackedByEntityEventType[TAttackerType]>(isAttackerTypeEvent.bind(undefined, attackerType))
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
