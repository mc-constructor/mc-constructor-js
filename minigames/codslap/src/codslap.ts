import { Inject, Injectable } from '@dandi/core'
import { Command, rawCmd, tellraw, text } from '@minecraft/core/cmd'
import { randomInt } from '@minecraft/core/entities'
import {
  ChannelEvent,
  Client, forPlayer,
  isEventType,
  Players,
  ServerChannel,
  ServerEvents,
  ServerThreadEventType
} from '@minecraft/core/server'
import { Minigame } from '@minecraft/minigames'

import { combineLatest, interval, Subscription } from 'rxjs'
import { filter, map, switchMap, take, tap } from 'rxjs/operators'

import { CommonCommands } from './common'
import { CodslapInitCommand } from './init'

/**
 * /summon minecraft:zombie ~ ~ ~ {HandItems:[{id:cod, Count:1,tag:{Enchantments:[{id:knockback,lvl:50}]}}]}
 */

const subs: Subscription[] = []

type PlayerDeathEventType = ServerThreadEventType.playerKilled | ServerThreadEventType.playerDied
function isPlayerDeathEvent(event: ChannelEvent<ServerChannel.thread>): event is ChannelEvent<ServerChannel.thread, PlayerDeathEventType> {
  return isEventType(ServerThreadEventType.playerDied, event) || isEventType(ServerThreadEventType.playerKilled, event)
}

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
    return tellraw('@a',text(`Here we go!`))
  }

  public ready(): Command {
    const thread$ = this.events$.channel(ServerChannel.thread)
    const sub = thread$.pipe(
      filter(isPlayerDeathEvent),
      tap(event => {
        rawCmd(`execute as ${event.data.player} run spawnpoint @s ${this.common.getRandomSpawn()}`).execute(this.client)
      }),
      switchMap(event => {
        // attempt to give an item to the player that died every 250 ms
        // the command will fail until they respawn
        const respawnCheck$ = interval(250)
          .pipe(tap(() => {
            // give(`@e[type=player,name=${event.data.player}]`, this.common.cod).execute(this.client)
            rawCmd(`execute as @e[type=player,name=${event.data.player}] run tp @s`).execute(this.client)
          }))

        // look for an event showing the give command succeeded, indicating the player has respawned
        // also look for a player disconnect
        const stopCheck$ = thread$.pipe(
          filter(forPlayer(event.data.player)),
          filter(checkEvent => {
            if (checkEvent.type === ServerThreadEventType.playerLeft) {
              return true
            }
            // if (isEventType(ServerThreadEventType.playerGivenItems, checkEvent) && checkEvent.data.item === 'Raw Cod') {
            //   return true
            // }
            if (isEventType(ServerThreadEventType.playerTeleported, checkEvent) && checkEvent.data.target === checkEvent.data.player) {
              return true
            }
          })
        )

        // runs respawnCheck$ until one of the stopCheck$ events is detected
        return combineLatest([respawnCheck$, stopCheck$])
          .pipe(take(1)) // VERY important or it will spaaaaaaam and never stop!
      }),
      map(([,stopCheckEvent]) => stopCheckEvent),
      filter(isEventType(ServerThreadEventType.playerTeleported)),
      tap((event) => {
        const creeperCount = randomInt(0, 6)
        this.common.resetPlayer(event.data.player).forEach(cmd => cmd.execute(this.client))
        rawCmd(`execute as @a run effect clear @s`).execute(this.client)
        for (let index = 0; index < creeperCount; index++) {
          rawCmd(`execute as @p run summon creeper ${this.common.getRandomSpawn()}`).execute(this.client)
        }
        const sheepCount = randomInt(10, 20)
        for (let index = 0; index < sheepCount; index++) {
          rawCmd(`execute as @p run summon sheep ${this.common.getRandomSpawn()} {Attributes:[{Name:generic.maxHealth,Base:2}],Health:2}`).execute(this.client)
        }
      })
    ).subscribe()
    subs.push(sub)
    return tellraw('@a', text('May the best codslapper win!').bold)
  }

}
