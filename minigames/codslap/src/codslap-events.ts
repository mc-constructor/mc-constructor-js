import { Inject, Injectable, Logger } from '@dandi/core'
import { actionbar, clearEffect, rawCmd, tellraw, text, title } from '@minecraft/core/cmd'
import { randomInt, SubscriptionTracker } from '@minecraft/core/common'
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
import { merge, Observable, partition } from 'rxjs'
import { filter, share, tap } from 'rxjs/operators'

import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands, isCodslapper } from './common'

@Injectable()
export class CodslapEvents {

  public readonly playerDeath$: Observable<AttackedEntityEvent>
  public readonly playerRespawn$: Observable<PlayerEvent>
  public readonly codslap$: Observable<PlayerEvent>
  public readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  public readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>
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
    @Inject(SubscriptionTracker) private subs: SubscriptionTracker,
    @Inject(Logger) private logger: Logger,
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

    this.run$ = merge(
      this.playerDeath$,
      this.playerRespawn$,
      this.playerAttack$,
      this.codslap$,
      this.codslapPlayerKill$,
      this.codslapMobKill$,
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
    rawCmd(`spawnpoint ${event.entityId} ${this.common.getRandomSpawn()}`).execute(this.client)
  }

  private onPlayerRespawn(event: PlayerEvent): void {
    const creeperCount = randomInt(0, 6)
    this.common.resetPlayer(event.player.name).execute(this.client)
    clearEffect('@').execute(this.client)
    for (let index = 0; index < creeperCount; index++) {
      rawCmd(`summon creeper ${this.common.getRandomSpawn()}`).execute(this.client)
    }
    const cowCount = randomInt(10, 20)
    for (let index = 0; index < cowCount; index++) {
      rawCmd(`summon cow ${this.common.getRandomSpawn()} {Attributes:[{Name:generic.maxHealth,Base:2}],Health:2}`).execute(this.client)
    }
  }

}
