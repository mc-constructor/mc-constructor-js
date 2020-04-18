import { Inject, Injectable, Logger } from '@dandi/core'
import { actionbar, clearEffect, rawCmd, text, title } from '@minecraft/core/cmd'
import { SubscriptionTracker } from '@minecraft/core/common'
import { Players } from '@minecraft/core/players'
import {
  AttackedByPlayerEvent,
  AttackedEntityEvent,
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

import { ArenaManager } from './arena-manager'
import { ArenaAgeEvent } from './arena/arena-age-event'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands, isCodslapper } from './common'

@Injectable()
export class CodslapEvents {

  public readonly playerDeath$: Observable<AttackedEntityEvent>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly codslap$: Observable<PlayerEvent>
  public readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  public readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>
  public readonly age$: Observable<ArenaAgeEvent>
  public readonly run$: Observable<any>

  private readonly entityDeath$: Observable<AttackedByPlayerEvent>
  private readonly playerAttack$: Observable<PlayerEvent>
  private readonly codslapKill$: Observable<AttackedByPlayerEvent>

  constructor(
    @Inject(Client) private client: Client,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Players) private players$: Players,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(ArenaManager) private arena: ArenaManager,
    @Inject(SubscriptionTracker) private subs: SubscriptionTracker,
    @Inject(Logger) private logger: Logger,
    @Inject(MinigameEvents) private minigameEvents: MinigameEvents,
  ) {
    this.entityDeath$ = events$.pipe(
      eventType(ServerEventType.entityLivingDeath),
      entityAttackerType(AttackerType.player),
      share(),
    )
    this.playerDeath$ = this.entityDeath$.pipe(
      filter(event => players$.hasNamedPlayer(event.entityId)),
      tap(this.onPlayerDeath.bind(this)),
    )
    this.playerRespawn$ = events$.pipe(
      eventType(ServerEventType.playerRespawn),
      tap(this.onPlayerRespawn.bind(this)),
    )
    this.playerAttack$ = events$.pipe(
      eventType(ServerEventType.playerAttackEntity),
    )
    this.codslap$ = this.playerAttack$.pipe(
      filter(event => isCodslapper(event.player.mainHand.item)),
      tap(this.onCodslap.bind(this)),
    )
    this.codslapKill$ = this.entityDeath$.pipe(
      filter(event => isCodslapper(event.attacker.mainHand.item)),
    )
    const [codslapPlayerKill$, codslapMobKill$] = partition(this.codslapKill$, event => players$.hasNamedPlayer(event.entityId))
    this.codslapPlayerKill$ = codslapPlayerKill$.pipe(tap(this.onCodslapPlayerKill.bind(this)))
    this.codslapMobKill$ = codslapMobKill$.pipe(tap(this.onCodslapMobKill.bind(this)))

    this.age$ = this.minigameEvents.age$.pipe(
      map(event => Object.assign({ arenaAge: 0 }, event)),
      scan((result, event) => Object.assign({}, event, {
          arenaAge: (result.arenaAge || 0) + 1,
        }, event)),
    )

    this.run$ = merge(
      this.playerDeath$,
      this.playerRespawn$,
      this.playerAttack$,
      this.codslap$,
      this.codslapPlayerKill$,
      this.codslapMobKill$,
      this.age$,
    )
  }

  private onCodslap(event: PlayerEvent): void {
    this.obj.codslap.incrementScore(event.player.name, 1)

    const [weapon, pointsTillNext] = this.common.getPlayerWeapon(event.player.name)
    if (weapon !== event.player.mainHand.item) {
      this.common.equip(event.player.name).execute(this.client)
    } else if (!isNaN(pointsTillNext)) {
      const isPlural = pointsTillNext > 1
      actionbar(event.player.name, text(`${pointsTillNext} codslap${isPlural ? 's' : ''} till your next codslapper!`)).execute(this.client)
    }
  }

  private onCodslapMobKill(event: AttackedByPlayerEvent): void {
    this.obj.codslapMobKill.incrementScore(event.attacker.name, 1)
    actionbar(event.attacker.name, text('Oh George, not the livestock!')).execute(this.client)
  }
  private onCodslapPlayerKill(event: AttackedByPlayerEvent): void {
    this.obj.codslapPlayerKill.incrementScore(event.attacker.name, 1)
    title(event.attacker.name, text('CODSLAP KILL')).execute(this.client)
  }

  private onPlayerDeath(event: EntityEvent): void {
    rawCmd(`spawnpoint ${event.entityId} ${this.arena.current.getRandomSpawn()}`).execute(this.client)
  }

  private onPlayerRespawn(event: PlayerEvent): void {
    this.common.resetPlayer(event.player.name).execute(this.client)
    clearEffect(event.player.name).execute(this.client)
  }

}
