import { Inject, Injectable, Logger } from '@dandi/core'
import { SubscriptionTracker } from '@minecraft/core/common'
import { Players } from '@minecraft/core/players'
import {
  AttackedByPlayerEvent,
  AttackedEntityEvent,
  AttackerType,
  Client,
  entityAttackerType,
  eventType,
  PlayerEvent,
  ServerEvents,
  ServerEventType
} from '@minecraft/core/server'
import { MinigameEvents } from '@minecraft/minigames'
import { merge, Observable, partition } from 'rxjs'
import { filter, map, scan, share } from 'rxjs/operators'

import { Arena } from './arena/arena'
import { ArenaAgeEvent } from './arena/arena-age-event'
import { ArenaManager } from './arena-manager'
import { CodslapObjectives } from './codslap-objectives'
import { isCodslapper } from './common'

@Injectable()
export class CodslapEvents {

  public readonly playerDeath$: Observable<AttackedEntityEvent>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly codslap$: Observable<PlayerEvent>
  public readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  public readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>
  public readonly age$: Observable<ArenaAgeEvent>
  public readonly arenaStart$: Observable<Arena>

  public readonly run$: Observable<any>

  private readonly entityDeath$: Observable<AttackedByPlayerEvent>
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
    this.entityDeath$ = events$.pipe(
      eventType(ServerEventType.entityLivingDeath),
      entityAttackerType(AttackerType.player),
      share(),
    )
    this.playerDeath$ = this.entityDeath$.pipe(
      filter(event => players$.hasNamedPlayer(event.entityId)),
    )
    this.playerRespawn$ = events$.pipe(
      eventType(ServerEventType.playerRespawn),
    )
    this.playerAttack$ = events$.pipe(
      eventType(ServerEventType.playerAttackEntity),
    )
    this.codslap$ = this.playerAttack$.pipe(
      filter(event => isCodslapper(event.player.mainHand.item)),
    )
    this.codslapKill$ = this.entityDeath$.pipe(
      filter(event => isCodslapper(event.attacker.mainHand.item)),
    )
    const [codslapPlayerKill$, codslapMobKill$] = partition(this.codslapKill$, event => players$.hasNamedPlayer(event.entityId))
    this.codslapPlayerKill$ = codslapPlayerKill$
    this.codslapMobKill$ = codslapMobKill$

    this.age$ = this.minigameEvents.age$.pipe(
      map(event => Object.assign({ arenaAge: 0 }, event)),
      scan((result, event) => Object.assign({}, event, {
          arenaAge: result.arenaAge + 1,
        })),
    )

    this.arenaStart$ = this.arenaManager.arenaStart$

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
