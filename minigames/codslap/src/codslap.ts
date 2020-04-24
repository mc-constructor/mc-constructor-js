import { Inject, Logger } from '@dandi/core'

import { actionbar, clearEffect, rawCmd, text, title } from '@minecraft/core/cmd'
import { Command } from '@minecraft/core/command'
import { Players } from '@minecraft/core/players'
import { AttackedByPlayerEvent, Client, EntityEvent, PlayerEvent } from '@minecraft/core/server'
import { Minigame } from '@minecraft/minigames'

import { combineLatest, merge, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import { ArenaManager } from './arena-manager'
import { Arena } from './arena/arena'
import { CodslapEvents } from './codslap-events'
import { Codslap } from './codslap-metadata'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { CodslapInitCommand } from './init'

/**
 * /summon minecraft:zombie ~ ~ ~ {HandItems:[{id:cod, Count:1,tag:{Enchantments:[{id:knockback,lvl:50}]}}]}
 */

@Minigame(Codslap)
export class CodslapMinigame implements Minigame {

  public readonly run$: Observable<any>

  constructor(
    @Inject(Client) private client: Client,
    @Inject(Players) private players$: Players,
    @Inject(CodslapEvents) private events: CodslapEvents,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CodslapInitCommand) public readonly init: CodslapInitCommand,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
    @Inject(ArenaManager) private readonly arena: ArenaManager,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.logger.debug('ctr', )
    const onPlayerDeath$ = combineLatest([this.events.playerDeath$, this.arena.arenaStart$])

    this.run$ = merge(
      this.events.codslap$.pipe(tap(this.onCodslap.bind(this))),
      onPlayerDeath$.pipe(tap(this.onPlayerDeath.bind(this))),
      this.events.codslapPlayerKill$.pipe(tap(this.onCodslapPlayerKill.bind(this))),
      this.events.codslapMobKill$.pipe(tap(this.onCodslapMobKill.bind(this))),
      this.events.playerRespawn$.pipe(tap(this.onPlayerRespawn.bind(this))),
      this.events.run$,
      this.arena.run$
    )
  }

  public validateGameState(): Command {
    return title('@a', text(`CODSLAP!`).bold, text('The game will begin in a moment...'))
  }

  public ready(): Command {
    return title('@a', text('Get ready!'), text('May the best codslapper win!').bold)
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

  private onPlayerDeath([event, arena]: [EntityEvent, Arena]): void {
    this.logger.debug('onPlayerDeath', event)
    rawCmd(`spawnpoint ${event.entityId} ${arena.getRandomSpawn()}`).execute(this.client)
  }

  private onPlayerRespawn(event: PlayerEvent): void {
    this.common.resetPlayer(event.player.name).execute(this.client)
    clearEffect(event.player.name).execute(this.client)
  }

}
