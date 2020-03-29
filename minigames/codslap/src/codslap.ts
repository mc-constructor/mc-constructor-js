import { Inject, Injectable } from '@dandi/core'
import { Command, give, rawCmd, tellraw, text } from '@minecraft/core/cmd'
import { randomInt } from '@minecraft/core/entities'
import { Client, Players, ServerChannel, ServerEvents, ServerThreadEventType } from '@minecraft/core/server'
import { Minigame } from '@minecraft/minigames'

import { Observable, Subscription } from 'rxjs'
import { delay, filter, mergeMap, retryWhen, tap } from 'rxjs/operators'
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

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Client) private client: Client,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CodslapInitCommand) public readonly init: CodslapInitCommand,
  ) {
  }

  public validateGameState(): Command {
    return rawCmd(`say Here we go!`, false)
  }

  public ready(): Command {
    const sub = this.events$
      .channel(ServerChannel.thread)
      .pipe(
        filter(event => event.type === ServerThreadEventType.playerDied || event.type === ServerThreadEventType.playerKilled),
        tap(event => {
          rawCmd(`execute as ${event.data.player} run spawnpoint @s ${this.common.getRandomSpawn()}`, true)
            .execute(this.client)
        }),
        mergeMap(event => {
          const cmd = give(`@e[type=player,name=${event.data.player}]`, this.common.cod, 64, event.data.player)
          const cmd$ = new Observable(o => {
            cmd.execute(this.events$.client).then(() => {
              o.next(event)
              o.complete()
            }, err => o.error(err))
          })
          return cmd$.pipe(
            retryWhen(errors => errors.pipe(delay(250))),
          )
        }),
        tap((event: any) => {
          const creeperCount = randomInt(0, 6)
          this.common.resetPlayer(event.data.player).forEach(cmd => cmd.execute(this.client))
          rawCmd(`execute as ${event.data.player} run teleport ${this.common.getRandomSpawn()}`, true).execute(this.client)
          rawCmd(`execute as @a run effect clear @s`, true).execute(this.client)
          for (let index = 0; index < creeperCount; index++) {
            rawCmd(`execute as @p run summon creeper ${this.common.getRandomSpawn()}`, true).execute(this.client)
          }
          const sheepCount = randomInt(10, 20)
          for (let index = 0; index < sheepCount; index++) {
            rawCmd(`execute as @p run summon sheep ${this.common.getRandomSpawn()} {Attributes:[{Name:generic.maxHealth,Base:2}],Health:2}`, true).execute(this.client)
          }
        })
      )
      .subscribe()
    subs.push(sub)
    return tellraw('@a', text('May the best codslapper win!').bold)
  }

}
