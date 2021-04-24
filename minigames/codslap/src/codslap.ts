import { Inject, Logger } from '@dandi/core'
import { silence } from '@ts-mc/common/rxjs'
import { RequestClient } from '@ts-mc/core/client'
import { Mob } from '@ts-mc/core/types'
import { actionbar, clearEffect, rawCmd, text, title } from '@ts-mc/core/cmd'
import { MapCommand, MapCommandOperatorFn, CommandRequest, parallel } from '@ts-mc/core/command'
import { AttackedByPlayerEvent, EntityEvent, PlayerEvent } from '@ts-mc/core/server-events'
import { Minigame } from '@ts-mc/minigames'
import { ArenaManager, CommonCommands, ConfiguredArena } from '@ts-mc/minigames/arenas'
import { SummonedEntityManager } from '@ts-mc/minigames/entities'

import { combineLatest, EMPTY, merge, Observable } from 'rxjs'
import { mergeMap, switchMapTo, take } from 'rxjs/operators'

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
    @Inject(MapCommand) private readonly mapCommand: MapCommandOperatorFn,
    @Inject(Logger) private readonly logger: Logger,
    @Inject(SummonedEntityManager) private readonly summonedEntities: SummonedEntityManager,
  ) {
    this.logger.debug('ctr')
    const onPlayerDeath$ = combineLatest([this.events.playerDeath$, this.arena.arenaInit$])
    
    this.summonedEntities.limitSpawn(Mob.cow, 25)

    const run$ = merge(
      this.mergeCmd(this.events.codslap$, this.onCodslap),
      this.mergeCmd(onPlayerDeath$, this.onPlayerDeath),
      this.mergeCmd(this.events.codslapPlayerKill$, this.onCodslapPlayerKill),
      this.mergeCmd(this.events.codslapMobKill$, this.onCodslapMobKill),
      this.mergeCmd(this.events.playerRespawn$, this.onPlayerRespawn),
      this.events.run$,
      this.arena.run$,
      this.obj.codslap.events$,
      this.obj.codslapMobKill.events$,
      this.obj.codslapPlayerKill.events$,
      this.summonedEntities.mobCountEvent$,
    )
    this.run$ = this.init().pipe(switchMapTo(run$))
  }

  private init(): Observable<any> {
    return title('@a', text(`CODSLAP!`).bold, text('The game will begin in a moment...')).execute(this.client).pipe(
      this.mapCommand(this.common.initHoldingArea()),
      switchMapTo(this.events.players$.pipe(take(1))),
      this.mapCommand(players => this.common.movePlayersToHolding(players)),
      this.mapCommand(this.initCmd.compile()),
      this.mapCommand(title('@a', text('Get ready!'), text('May the best codslapper win!').bold)),
    )
  }

  private mergeCmd<T>(source$: Observable<T>, fn: (value: T) => CommandRequest): Observable<any> {
    return source$.pipe(
      mergeMap(v => {
        const cmd = fn.call(this, v)
        return cmd ? cmd.execute(this.client).pipe(silence) : EMPTY
      }),
    )
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
