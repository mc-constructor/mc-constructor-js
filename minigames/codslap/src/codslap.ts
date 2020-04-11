import { Inject, Injectable } from '@dandi/core'
import { actionbar, Command, rawCmd, text, title } from '@minecraft/core/cmd'
import { randomInt } from '@minecraft/core/common'
import {
  AttackedByPlayerEvent,
  AttackedEntityEvent,
  AttackerType,
  Client,
  entityAttackerType,
  EntityEvent,
  eventType,
  PlayerEvent,
  Players,
  ServerEvents,
  ServerEventType
} from '@minecraft/core/server'
import { Item } from '@minecraft/core/types'
import { Minigame } from '@minecraft/minigames'

import { combineLatest, interval, Observable, partition, Subscription } from 'rxjs'
import { filter, share, tap } from 'rxjs/operators'

import { CommonCommands } from './common'
import { CodslapInitCommand } from './init'

/**
 * /summon minecraft:zombie ~ ~ ~ {HandItems:[{id:cod, Count:1,tag:{Enchantments:[{id:knockback,lvl:50}]}}]}
 */

const subs: Subscription[] = []

@Injectable(Minigame)
export class CodslapMiniGame implements Minigame {

  public static cleanup(): void {
    subs.forEach(sub => sub.unsubscribe())
    subs.length = 0
  }

  private readonly entityDeath$: Observable<AttackedByPlayerEvent>
  private readonly playerDeath$: Observable<AttackedEntityEvent>
  private readonly playerRespawn$: Observable<PlayerEvent>
  private readonly playerAttack$: Observable<PlayerEvent>
  private readonly codslap$: Observable<PlayerEvent>
  private readonly codslapKill$: Observable<AttackedByPlayerEvent>
  private readonly codslapMobKill$: Observable<AttackedByPlayerEvent>
  private readonly codslapPlayerKill$: Observable<AttackedByPlayerEvent>

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Client) private client: Client,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CodslapInitCommand) public readonly init: CodslapInitCommand,
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
      filter(event => event.player.mainHand.item === Item.codslapper),
    )
    this.codslapKill$ = this.entityDeath$.pipe(
      filter(event => event.attacker.mainHand.item === Item.codslapper),
    )
    const [codslapPlayerKill$, codslapMobKill$] = partition(this.codslapKill$, event => players$.hasNamedPlayer(event.entityId))
    this.codslapPlayerKill$ = codslapPlayerKill$
    this.codslapMobKill$ = codslapMobKill$
  }

  public validateGameState(): Command {
    return title('@a', text(`CODSLAP!`).bold, text('The game will begin in a moment...'))
  }

  public ready(): Command {
    this.initStreams()
    return title('@a', text('Get ready!'), text('May the best codslapper win!').bold)
  }

  private initStreams(): void {
    subs.push(
      this.events$.pipe(eventType(ServerEventType.entityLivingDeath), filter(event => event.attackerType !== 'player')).subscribe(console.log.bind(console)),
      this.playerDeath$.subscribe(this.onPlayerDeath.bind(this)),
      this.playerRespawn$.subscribe(this.onPlayerRespawn.bind(this)),
      this.players$.subscribe(players => console.log('Codslap Players', players)),
      this.codslap$.subscribe(this.onCodslap.bind(this)),
      this.codslapMobKill$.subscribe(this.onCodslapMobKill.bind(this)),
      this.codslapPlayerKill$.subscribe(this.onCodslapPlayerKill.bind(this)),
    )
  }

  private initScoreboardCheckTrigger(): Observable<any> {
    return combineLatest([this.players$, interval(1500)]).pipe(
      tap(([players]) => {
        players.forEach(player => {
          rawCmd(`scoreboard players list ${player.name}`).execute(this.client)
        })
      })
    )
  }

  private onCodslap(event: PlayerEvent): void {
    rawCmd(`scoreboard players add ${event.player.name} codslap 1`).execute(this.client)
  }

  private onCodslapMobKill(event: AttackedByPlayerEvent): void {
    console.log('onCodslapMobKill', event)
    rawCmd(`scoreboard players add ${event.attacker.name} codslap_mob_kill 1`).execute(this.client)
    actionbar(event.attacker.name, text('Hey, be nice to the animals, okay?')).execute(this.client)
  }
  private onCodslapPlayerKill(event: AttackedByPlayerEvent): void {
    console.log('onCodslapPlayerKill', event)
    rawCmd(`scoreboard players add ${event.attacker.name} codslap_player_kill 1`).execute(this.client)
    title(event.attacker.name, text('CODSLAP KILL')).execute(this.client)
  }

  private onPlayerDeath(event: EntityEvent): void {
    rawCmd(`spawnpoint ${event.entityId} ${this.common.getRandomSpawn()}`).execute(this.client)
  }

  private onPlayerRespawn(event: PlayerEvent): void {
    const creeperCount = randomInt(0, 6)
    this.common.resetPlayer(event.player.name).forEach(cmd => cmd.execute(this.client))
    rawCmd(`effect clear @a`).execute(this.client)
    for (let index = 0; index < creeperCount; index++) {
      rawCmd(`summon creeper ${this.common.getRandomSpawn()}`).execute(this.client)
    }
    const sheepCount = randomInt(10, 20)
    for (let index = 0; index < sheepCount; index++) {
      rawCmd(`summon sheep ${this.common.getRandomSpawn()} {Attributes:[{Name:generic.maxHealth,Base:2}],Health:2}`).execute(this.client)
    }
  }

}
