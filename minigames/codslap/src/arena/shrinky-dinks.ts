import { Inject, Logger } from '@dandi/core'
import { block, text, title } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { randomInt, randomIntGenerator } from '@minecraft/core/common'
import { CommandOperator, CommandOperatorFn, RandomIntervalScheduler } from '@minecraft/core/common/rxjs'
import { area, Block, loc, Mob } from '@minecraft/core/types'

import { interval, Observable } from 'rxjs'
import { delay, map, switchMap, switchMapTo, takeWhile, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CommonCommands } from '../common'
import { summonBehavior } from '../hooks'

import { Arena, ArenaConstructor } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

@Arena()
class ShrinkyDinksArena extends PlatformArena {

  public static readonly title = text('Shrinky Dinks!').bold
  public static readonly description = text(`Keep an eye on the edges...`)

  public static readonly entryRequirements = [
    Arena.requirements.minArenaAge(300),
  ]
  // public static readonly entryRequirements = Arena.requirements.none

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
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common.center)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Arena.requirements.minArenaAge(ShrinkyDinksArena.minDelay)(events, this).pipe(
      tap(() => this.logger.debug('minimum arena age met, waiting for next available arena to start shrinking')),
      switchMapTo(events.arenaAvailable$),
      tap(() => this.logger.debug('next arena is available, starting shrink timer')),
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

  private getNextRow(): Command {
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

    this.spawnBlacklist.push(
      area(nw, ne.modify.up(1)),
      area(ne, se.modify.up(1)),
      area(se, sw.modify.up(1)),
      area(sw, nw.modify.up(1)),
    )

    return parallel(
      north,
      east,
      south,
      west
    )
  }
}

export const ShrinkyDinks: ArenaConstructor<ShrinkyDinksArena> = ShrinkyDinksArena
