import { InjectionToken, Logger, Provider } from '@dandi/core'
import { Observable, OperatorFunction } from 'rxjs'
import { filter, map, share } from 'rxjs/operators'

import { ResponseClient } from '@ts-mc/core/client'

import {
  AttackedByEntityEventType,
  parseAttackedEntityEvent,
  parseEntityEvent,
  AttackedEntityEvent,
  EntityEvent, AttackerType
} from './entity'
import { localToken } from './local-token'
import { MinigameStartEvent, parseMinigameStartEvent } from './minigame'
import { parsePlayerEvent, PlayerEvent } from './player-event'
import { parseMessage, ServerEvent } from './server-event'
import { ServerEventType } from './server-event-type'

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

export function isEventTypeFn<TEvent extends ServerEventType>(type: TEvent): (event: ServerEvent) => event is ServerEventTypes[TEvent] {
  return (event: ServerEvent): event is ServerEventTypes[TEvent] => isEventType(type, event)
}

export function eventType<TEvent extends ServerEventType>(type: TEvent): OperatorFunction<ServerEvent, ServerEventTypes[TEvent]> {
  return filter<ServerEvent, ServerEventTypes[TEvent]>(isEventTypeFn(type))
}

export function isAttackerTypeEvent<TAttackerType extends AttackerType>(attackerType: TAttackerType, event: AttackedEntityEvent): event is AttackedByEntityEventType[TAttackerType] {
  return event.attackerType === attackerType
}

export function isAttackTypeEventFn<TAttackerType extends AttackerType>(attackerType: TAttackerType): (event: AttackedEntityEvent) => event is AttackedByEntityEventType[TAttackerType] {
  return (event: AttackedEntityEvent): event is AttackedByEntityEventType[TAttackerType] => isAttackerTypeEvent(attackerType, event)
}

export function entityAttackerType<TAttackerType extends AttackerType>(attackerType: TAttackerType): OperatorFunction<AttackedEntityEvent, AttackedByEntityEventType[TAttackerType]> {
  return filter<AttackedEntityEvent, AttackedByEntityEventType[TAttackerType]>(isAttackTypeEventFn(attackerType))
}

export type ServerEvents = Observable<ServerEvent>
export const ServerEvents: InjectionToken<ServerEvents> = localToken.opinionated<ServerEvents>('ServerEvents', {
  multi: false,
})

export const ServerEventsProvider: Provider<ServerEvents> = {
  provide: ServerEvents,
  useFactory(client: ResponseClient, logger: Logger): ServerEvents {
    return client.messages$
      .pipe(
        map(parseMessage),
        filter(event => {
          if (PARSERS[event.type]) {
            return true
          }
          logger.warn(`No parser for ${event.type}`, event)
          return false
        }),
        map(event => PARSERS[event.type](event)),
        share(),
      )
  },
  deps: [ResponseClient, Logger],
}
