import { Inject, Logger } from '@dandi/core'
import { RandomIntervalScheduler } from '@ts-mc/common/rxjs'
import { block, text, title } from '@ts-mc/core/cmd'
import { MapCommand, MapCommandOperatorFn, CommandRequest, parallel } from '@ts-mc/core/command'
import { area, Block, loc } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer } from '@ts-mc/minigames/arenas'

import { interval, Observable, race } from 'rxjs'
import { delay, switchMap, switchMapTo, takeWhile, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CodslapCommonCommands } from '../codslap-common-commands'
import { Codslap } from '../codslap-static'

@Arena()
class ShrinkyDinksArena extends ArenaBase<CodslapEvents, CodslapCommonCommands> {

  public static readonly title = text('Shrinky Dinks!').bold
  public static readonly description = text(`Keep an eye on the edges...`)

  public readonly exitRequirements = [
    (events: CodslapEvents, arena: ShrinkyDinksArena) => arena.run(events)
  ]

  private static readonly minDelay = 10 // seconds
  private static readonly minRadius = 1
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
      this.common.summonCowsOnStartBehavior,
    ],
    playerRespawn$: [
      this.common.summonCowsOnRespawnBehavior,
    ],
  }

  private currentRadius = ShrinkyDinksArena.initialRadius

  constructor(
    @Inject(CodslapCommonCommands) common: CodslapCommonCommands,
    @Inject(MapCommand) private readonly mapCommand: MapCommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Codslap.requirements.minArenaAge(ShrinkyDinksArena.minDelay)(events, this).pipe(
      tap(() => this.logger.debug('minimum arena age met, waiting for last or next available arena to start shrinking')),
      switchMapTo(race(events.arenaAvailable$, events.lastArena$)),
      tap(() => this.logger.debug('last or next arena is available, starting shrink timer')),
      switchMap(() => interval(ShrinkyDinksArena.removeRowInterval, ShrinkyDinksArena.removeRowScheduler)),
      tap(() => this.logger.debug('shrink timer tick')),
      this.mapCommand(title('@a', text('Watch out!'))),
      delay(1500),
      // FIXME: if a player dies, pause until they respawn or disconnect before continuing
      this.mapCommand(this.getNextRow.bind(this)),
      tap(() => this.currentRadius--),  // must happen after getNextRow to ensure the first row doesn't get skipped
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
