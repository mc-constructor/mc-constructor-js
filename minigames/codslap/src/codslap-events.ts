import { Inject, Injectable, Logger } from '@dandi/core'
import { SubscriptionTracker } from '@minecraft/core/common/rxjs'
import { Players } from '@minecraft/core/players'
import {
  AttackedByPlayerEvent,
  AttackerType,
  Client,
  entityAttackerType,
  EntityEvent,
  eventType,
  PlayerEvent,
  ServerEvents,
  ServerEventType
} from '@minecraft/core/server'
import { MinigameEvents } from '@minecraft/minigames'
import { merge, Observable, partition } from 'rxjs'
import { filter, map, scan, share, tap } from 'rxjs/operators'

import { Arena, arenaDescriptor } from './arena/arena'
import { ArenaAgeEvent } from './arena/arena-age-event'
import { ArenaManager } from './arena-manager'
import { CodslapObjectives } from './codslap-objectives'
import { isCodslapper } from './common'

@Injectable()
export class CodslapEvents {

  public readonly playerDeath$: Observable<EntityEvent>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly codslap$: Observable<PlayerEvent>
  public readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  public readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>
  public readonly age$: Observable<ArenaAgeEvent>
  public readonly arenaAvailable$: Observable<Arena>
  public readonly arenaStart$: Observable<Arena>

  public readonly run$: Observable<any>

  private readonly entityDeath$: Observable<EntityEvent>
  private readonly playerAttack$: Observable<PlayerEvent>
  private readonly codslapKill$: Observable<AttackedByPlayerEvent>

  constructor(
    @Inject(Client) private client: Client,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Players) private players$: Players,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
    @Inject(SubscriptionTracker) private subs: SubscriptionTracker,
    @Inject(MinigameEvents) private minigameEvents: MinigameEvents,
    @Inject(ArenaManager) private arenaManager: ArenaManager,
    @Inject(Logger) private logger: Logger,
  ) {
    this.logger.debug('ctr')
    this.entityDeath$ = events$.pipe(
      eventType(ServerEventType.entityLivingDeath),
      tap(event => this.logger.debug('entityDeath$ - entityLivingDeath', event.entityId)),
      share(),
    )
    this.playerDeath$ = this.entityDeath$.pipe(
      filter(event => players$.hasNamedPlayer(event.entityId)),
      tap(event => this.logger.debug('playerDeath$', event.entityId)),
      share(),
    )
    this.playerRespawn$ = events$.pipe(
      eventType(ServerEventType.playerRespawn),
      tap(event => this.logger.debug('playerRespawn$', event.player.name)),
    )
    this.playerAttack$ = events$.pipe(
      eventType(ServerEventType.playerAttackEntity),
    )
    this.codslap$ = this.playerAttack$.pipe(
      filter(event => isCodslapper(event.player.mainHand.item)),
    )
    this.codslapKill$ = this.entityDeath$.pipe(
      entityAttackerType(AttackerType.player),
      filter(event => isCodslapper(event.attacker.mainHand.item)),
      share(),
    )
    const [codslapPlayerKill$, codslapMobKill$] = partition(this.codslapKill$, event => players$.hasNamedPlayer(event.entityId))
    this.codslapPlayerKill$ = codslapPlayerKill$
    this.codslapMobKill$ = codslapMobKill$

    this.age$ = this.minigameEvents.age$.pipe(
      map(event => Object.assign({ arenaAge: 0 }, event)),
      scan((result, event) => Object.assign({}, event, {
          arenaAge: result.arenaAge + 1,
        })),
      tap(event => this.logger.debug('age$', event)),
      share(),
    )

    this.arenaAvailable$ = this.arenaManager.arenaAvailable$.pipe(tap(event => this.logger.debug('arenaAvailable$', arenaDescriptor(event).title)))
    this.arenaStart$ = this.arenaManager.arenaStart$.pipe(tap(event => this.logger.debug('arenaStart$', arenaDescriptor(event).title)))

    this.run$ = merge(
      this.playerDeath$,
      this.playerRespawn$,
      this.playerAttack$,
      this.codslap$,
      this.codslapPlayerKill$,
      this.codslapMobKill$,
      this.age$,
      this.arenaStart$,
    )
  }

}
