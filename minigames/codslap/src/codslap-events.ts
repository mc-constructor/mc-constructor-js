import { Inject, Injectable, Logger } from '@dandi/core'
import { SubscriptionTracker } from '@minecraft/core/common/rxjs'
import { Players } from '@minecraft/core/players'
import {
  AttackedByPlayerEvent,
  AttackerType,
  Client,
  entityAttackerType,
  PlayerEvent,
  ServerEvents,
} from '@minecraft/core/server'
import { MinigameEvents } from '@minecraft/minigames'
import { Observable, partition } from 'rxjs'
import { filter, map, scan, share, tap } from 'rxjs/operators'

import { ArenaAgeEvent, arenaDescriptor, ConfiguredArena } from './arena'
import { ArenaManager } from './arena-manager'
import { CodslapObjectives } from './codslap-objectives'
import { isCodslapper } from './common'

@Injectable(MinigameEvents)
export class CodslapEvents extends MinigameEvents {

  public readonly codslap$: Observable<PlayerEvent>
  public readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  public readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>
  public readonly age$: Observable<ArenaAgeEvent>
  public readonly arenaAvailable$: Observable<ConfiguredArena>
  public readonly arenaStart$: Observable<ConfiguredArena>

  private readonly codslapKill$: Observable<AttackedByPlayerEvent>

  constructor(
    @Inject(Client) private client: Client,
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(Players) players: Players,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
    @Inject(SubscriptionTracker) private subs: SubscriptionTracker,
    @Inject(ArenaManager) private arenaManager: ArenaManager,
    @Inject(Logger) logger: Logger,
  ) {
    super(events$, players, logger)
    this.codslap$ = this.playerAttack$.pipe(
      filter(event => isCodslapper(event.player.mainHand.item)),
    )
    this.codslapKill$ = this.entityDeath$.pipe(
      entityAttackerType(AttackerType.player),
      filter(event => isCodslapper(event.attacker.mainHand.item)),
      share(),
    )
    const [codslapPlayerKill$, codslapMobKill$] = partition(this.codslapKill$, event => players.hasNamedPlayer(event.entityId))
    this.codslapPlayerKill$ = codslapPlayerKill$
    this.codslapMobKill$ = codslapMobKill$

    this.age$ = this.minigameAge$.pipe(
      map(event => Object.assign({ arenaAge: 0 }, event)),
      scan((result, event) => Object.assign({}, event, {
          arenaAge: result.arenaAge + 1,
        })),
      tap(event => this.logger.debug('age$', event)),
      share(),
    )

    this.arenaAvailable$ = this.arenaManager.arenaAvailable$.pipe(
      this.debug(arena => ['arenaAvailable$', arenaDescriptor(arena.instance).title]),
    )
    this.arenaStart$ = this.arenaManager.arenaStart$.pipe(
      this.debug(arena => ['arenaStart$', arenaDescriptor(arena.instance).title]),
    )
  }

  protected getRunStreams(): Observable<any>[] {
    return super.getRunStreams().concat(
      this.codslap$,
      this.codslapPlayerKill$,
      this.codslapMobKill$,
      this.age$,
      this.arenaStart$,
    )
  }

}
