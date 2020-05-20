import { Inject, Logger } from '@dandi/core'
import { silence } from '@ts-mc/common/rxjs'
import { RequestClient } from '@ts-mc/core/client'
import { actionbar, clearEffect, rawCmd, text, title } from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { AttackedByPlayerEvent, EntityEvent, PlayerEvent } from '@ts-mc/core/server-events'
import { Minigame } from '@ts-mc/minigames'
import { ArenaManager, CommonCommands, ConfiguredArena } from '@ts-mc/minigames/arenas'

import { combineLatest, EMPTY, merge, Observable, OperatorFunction } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { CodslapEvents } from './codslap-events'
import { Codslap } from './codslap-metadata'
import { CodslapObjectives } from './codslap-objectives'
import { CodslapCommonCommands } from './codslap-common-commands'
import { CodslapInit } from './init'

/**
 * /summon minecraft:zombie ~ ~ ~ {HandItems:[{id:cod, Count:1,tag:{Enchantments:[{id:knockback,lvl:50}]}}]}
 */

@Minigame(Codslap)
export class CodslapMinigame implements Minigame {

  public readonly run$: Observable<any>

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(CodslapEvents) private events: CodslapEvents,
    @Inject(CommonCommands) private common: CodslapCommonCommands,
    @Inject(CodslapInit) private readonly initCmd: CodslapInit,
    @Inject(CodslapObjectives) private readonly obj: CodslapObjectives,
    @Inject(ArenaManager) private readonly arena: ArenaManager<CodslapEvents>,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.logger.debug('ctr', )
    const onPlayerDeath$ = combineLatest([this.events.playerDeath$, this.arena.arenaInit$])

    this.run$ = merge(
      this.events.codslap$.pipe(this.mergeCmd(this.onCodslap.bind(this))),
      onPlayerDeath$.pipe(this.mergeCmd(this.onPlayerDeath.bind(this))),
      this.events.codslapPlayerKill$.pipe(this.mergeCmd(this.onCodslapPlayerKill.bind(this))),
      this.events.codslapMobKill$.pipe(this.mergeCmd(this.onCodslapMobKill.bind(this))),
      this.events.playerRespawn$.pipe(this.mergeCmd(this.onPlayerRespawn.bind(this))),
      this.events.run$,
      this.arena.run$,
      this.obj.codslap.events$,
      this.obj.codslapMobKill.events$,
      this.obj.codslapPlayerKill.events$,
    )
  }

  public validateGameState(): CommandRequest {
    return title('@a', text(`CODSLAP!`).bold, text('The game will begin in a moment...'))
  }

  public init(): CommandRequest {
    return this.initCmd.compile()
  }

  public ready(): CommandRequest {
    return title('@a', text('Get ready!'), text('May the best codslapper win!').bold)
  }

  private mergeCmd(fn: (value: any) => CommandRequest): OperatorFunction<any, any> {
    return mergeMap(v => {
      const cmd = fn(v)
      return cmd ? cmd.execute(this.client).pipe(silence) : EMPTY
    })
  }

  private onCodslap(event: PlayerEvent): CommandRequest {
    this.obj.codslap.incrementScore(event.player.name, 1)

    const [weapon, pointsTillNext] = this.common.getPlayerWeapon(event.player.name)
    if (weapon !== event.player.mainHand.item) {
      return this.common.equip(event.player.name)
    }
    if (weapon === event.player.mainHand.item && !isNaN(pointsTillNext)) {
      const isPlural = pointsTillNext > 1
      return actionbar(event.player.name, text(`${pointsTillNext} codslap${isPlural ? 's' : ''} till your next codslapper!`))
    }
    return undefined
  }

  private onCodslapMobKill(event: AttackedByPlayerEvent): CommandRequest {
    this.obj.codslapMobKill.incrementScore(event.attacker.name, 1)
    return actionbar(event.attacker.name, text('Oh George, not the livestock!'))
  }

  private onCodslapPlayerKill(event: AttackedByPlayerEvent): CommandRequest {
    this.obj.codslapPlayerKill.incrementScore(event.attacker.name, 1)
    return title(event.attacker.name, text('CODSLAP KILL'))
  }

  private onPlayerDeath([event, arena]: [EntityEvent, ConfiguredArena<CodslapEvents>]): CommandRequest {
    this.logger.debug('onPlayerDeath', event)
    return rawCmd(`spawnpoint ${event.entityId} ${arena.instance.getRandomSpawn()}`)
  }

  private onPlayerRespawn(event: PlayerEvent): CommandRequest {
    return parallel(
      this.common.resetPlayer(event.player.name),
      clearEffect(event.player.name),
    )
  }

}
