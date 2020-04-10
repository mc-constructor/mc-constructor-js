import { Inject, Injectable } from '@dandi/core'
import { Command, rawCmd, tellraw, text } from '@minecraft/core/cmd'
import { randomInt } from '@minecraft/core/common'
import {
  Client,
  EntityEvent,
  eventType,
  PlayerEvent,
  Players,
  ServerEvents,
  ServerEventType
} from '@minecraft/core/server'
import { Minigame } from '@minecraft/minigames'

import { combineLatest, interval, Observable, Subscription } from 'rxjs'
import { filter, tap } from 'rxjs/operators'

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

  private readonly playerDeath$: Observable<EntityEvent>
  private readonly playerRespawn$: Observable<PlayerEvent>

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Client) private client: Client,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CodslapInitCommand) public readonly init: CodslapInitCommand,
  ) {
    this.playerDeath$ = events$.pipe(
      eventType(ServerEventType.entityLivingDeath),
      filter(event => players$.hasNamedPlayer(event.entityId)),
    )
    this.playerRespawn$ = events$.pipe(
      eventType(ServerEventType.playerRespawn),
    )
  }

  public validateGameState(): Command {
    return tellraw('@a',text(`Here we go!`))
  }

  public ready(): Command {
    this.initStreams()
    return tellraw('@a', text('May the best codslapper win!').bold)
  }

  private initStreams(): void {
    subs.push(
      this.playerDeath$.subscribe(this.onPlayerDeath.bind(this)),
      this.playerRespawn$.subscribe(this.onPlayerRespawn.bind(this)),
      this.players$.subscribe(players => console.log('Codslap Players', players))
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
