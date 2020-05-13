import { Inject, Logger } from '@dandi/core'
import { RequestClient } from '@ts-mc/core/client'
import {
  AttackedByPlayerEvent,
  AttackerType,
  entityAttackerType,
  PlayerEvent,
  ServerEvents
} from '@ts-mc/core/server-events'
import { Players } from '@ts-mc/core/players'
import { ArenaManager, ArenaMinigameEvents } from '@ts-mc/minigames/arenas'

import { Observable, partition } from 'rxjs'
import { filter, share } from 'rxjs/operators'

import { CodslapObjectives } from './codslap-objectives'
import { isCodslapper } from './codslap-common-commands'

export class CodslapEvents extends ArenaMinigameEvents {

  public readonly codslap$: Observable<PlayerEvent>
  public readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  public readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>

  private readonly codslapKill$: Observable<AttackedByPlayerEvent>

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(Players) players: Players,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
    @Inject(ArenaManager) arenaManager: ArenaManager<any>,
    @Inject(Logger) logger: Logger,
  ) {
    super(arenaManager, events$, players, logger)
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
  }

  protected getRunStreams(): Observable<any>[] {
    return super.getRunStreams().concat(
      this.codslap$,
      this.codslapPlayerKill$,
      this.codslapMobKill$,
    )
  }

}
