import { Inject, Logger } from '@dandi/core'
import { randomIntGenerator } from '@ts-mc/common'
import { RandomIntervalScheduler } from '@ts-mc/common/rxjs'
import { block, text, title } from '@ts-mc/core/cmd'
import { CommandOperator, CommandOperatorFn, CommandRequest, parallel } from '@ts-mc/core/command'
import { area, Block, loc, Mob } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer, summonBehavior } from '@ts-mc/minigames/arenas'

import { interval, Observable } from 'rxjs'
import { delay, map, switchMap, switchMapTo, takeWhile, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CodslapCommonCommands } from '../codslap-common-commands'
import { Codslap } from '../codslap-static'

@Arena()
class ShrinkyDinksArena extends ArenaBase<CodslapEvents> {

  public static readonly title = text('Shrinky Dinks!').bold
  public static readonly description = text(`Keep an eye on the edges...`)

  public static readonly exitRequirements = [
    (events: CodslapEvents, arena: ShrinkyDinksArena) => arena.run(events)
  ]

  private static readonly minDelay = 20 // seconds
  private static readonly minRadius = 1
  // private static readonly removeRowInterval = 15000 // milliseconds
  private static readonly removeRowInterval = 10000 // milliseconds
  private static readonly removeRowVariation = 5000 // milliseconds
  private static readonly removeRowScheduler = new RandomIntervalScheduler(ShrinkyDinksArena.removeRowVariation)
  private static readonly initialRadius = 15

  public readonly layers: PlatformLayer[] = [
    {
      radius: ShrinkyDinksArena.initialRadius,
      block: block(Block.grassBlock),
      centerOffset: loc(0, 25, 0),
      depth: 1,
    },
  ]

  public readonly hooks = {
    arenaStart$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
    playerRespawn$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
  }

  private currentRadius = ShrinkyDinksArena.initialRadius

  constructor(
    @Inject(CodslapCommonCommands) common: CodslapCommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Codslap.requirements.minArenaAge(ShrinkyDinksArena.minDelay)(events, this).pipe(
      tap(() => this.logger.debug('minimum arenas age met, waiting for next available arenas to start shrinking')),
      switchMapTo(events.arenaAvailable$),
      tap(() => this.logger.debug('next arenas is available, starting shrink timer')),
      switchMap(() => interval(ShrinkyDinksArena.removeRowInterval, ShrinkyDinksArena.removeRowScheduler)),
      tap(() => this.logger.debug('shrink timer tick')),
      this.command(title('@a', text('Watch out!'))),
      map(this.getNextRow.bind(this)),
      delay(1500),
      // FIXME: if a player dies, pause until they respawn or disconnect before continuing
      tap(() => this.currentRadius--),
      this.command(),
      takeWhile(() => this.currentRadius > ShrinkyDinksArena.minRadius),
    )
  }

  private getNextRow(): CommandRequest {
    const [layer] = this.layers
    const center = this.center.modify.offset(layer.centerOffset)
    const nw = center.modify.north(this.currentRadius).modify.west(this.currentRadius)
    const ne = center.modify.north(this.currentRadius).modify.east(this.currentRadius)
    const sw = center.modify.south(this.currentRadius).modify.west(this.currentRadius)
    const se = center.modify.south(this.currentRadius).modify.east(this.currentRadius)

    const air = block(Block.air)
    const north = air.fill(nw, ne.modify.up(1))
    const east = air.fill(ne, se.modify.up(1))
    const south = air.fill(se, sw.modify.up(1))
    const west = air.fill(sw, nw.modify.up(1))

    this.blacklistSpawnArea(
      area(nw, ne),
      area(ne, se),
      area(se, sw),
      area(sw, nw),
    )

    return parallel(
      north,
      east,
      south,
      west
    )
  }
}

export const ShrinkyDinks: ArenaConstructor<CodslapEvents, ShrinkyDinksArena> = ShrinkyDinksArena
