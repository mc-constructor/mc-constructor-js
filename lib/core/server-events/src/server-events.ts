import { Inject, Injectable, InjectionToken, Logger, Provider } from '@dandi/core'
import { silence } from '@ts-mc/common/rxjs'
import { RequestClient, RequestType, ResponseClient } from '@ts-mc/core/client'
import { defer, Observable, OperatorFunction } from 'rxjs'
import { filter, finalize, map, share, switchMapTo, tap } from 'rxjs/operators'


import {
  AttackedByEntityEventType,
  AttackedEntityEvent,
  AttackerType,
  EntityEvent,
  parseAttackedEntityEvent,
  parseEntityEvent
} from './entity'
import { localToken } from './local-token'
import { MinigameStartEvent, parseMinigameStartEvent } from './minigame'
import { parsePlayerEvent, PlayerEvent } from './player-event'
import { parseMessage, ServerEvent } from './server-event'
import { ServerEventType } from './server-event-type'

type ServerEventParserFn<TEvent extends ServerEvent> = (event: ServerEvent) => TEvent
type ServerEventTypes = {
  [ServerEventType.entityJoinWorld]: EntityEvent
  [ServerEventType.livingDeath]: AttackedEntityEvent
  [ServerEventType.livingAttack]: AttackedEntityEvent
  [ServerEventType.livingDamage]: AttackedEntityEvent
  [ServerEventType.livingFall]: EntityEvent
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
  [ServerEventType.entityJoinWorld]: parseEntityEvent,
  [ServerEventType.livingDeath]: parseAttackedEntityEvent,
  [ServerEventType.livingAttack]: parseAttackedEntityEvent,
  [ServerEventType.livingDamage]: parseAttackedEntityEvent,
  [ServerEventType.livingFall]: parseEntityEvent,
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

export interface ServerEvents {
  eventStream<TEvent extends ServerEventType>(type: TEvent): Observable<ServerEventTypes[TEvent]>
  run$: Observable<never>
}

export const ServerEvents: InjectionToken<ServerEvents> = localToken.opinionated<ServerEvents>('ServerEvents', {
  multi: false,
})

@Injectable(ServerEvents)
class ServerEventsImpl implements ServerEvents {

  private readonly streams = new Map<ServerEventType, Observable<ServerEvent>>()
  private readonly events$: Observable<ServerEvent>;
  
  public readonly run$: Observable<never>;

  constructor(
    @Inject(RequestClient) private readonly req: RequestClient,
    @Inject(ResponseClient) res: ResponseClient,
    @Inject(Logger) private readonly logger: Logger
  ) {
    this.events$ = res.messages$
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
    this.run$ = this.events$.pipe(silence);
  }

  public eventStream<TEvent extends ServerEventType>(type: TEvent): Observable<ServerEventTypes[TEvent]> {
    if (this.streams.has(type)) {
      return this.streams.get(type) as Observable<ServerEventTypes[TEvent]>;
    }
    return defer(() => {
      return this.req.send(RequestType.eventSubscription, `add ${type}`, true)
    }).pipe(
      switchMapTo(this.events$),
      eventType(type),
      finalize(() => {
        this.req.send(RequestType.eventSubscription, `remove ${type}`, true).subscribe();
      }),
      share(),
    )
  }

}

export const ServerEventsProvider: Provider<ServerEvents> = {
  provide: ServerEvents,
  useClass: ServerEventsImpl,
}
