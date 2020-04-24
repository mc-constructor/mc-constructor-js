import { Inject, Logger } from '@dandi/core'
import { block, text, title } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { randomInt, randomIntGenerator } from '@minecraft/core/common'
import { CommandOperator, CommandOperatorFn } from '@minecraft/core/common/rxjs'
import { Client } from '@minecraft/core/server'
import { area, Block, loc, Mob } from '@minecraft/core/types'

import { interval, Observable, SchedulerAction, SchedulerLike, Subscription, timer } from 'rxjs'
import { Action } from 'rxjs/internal/scheduler/Action'
import { delay, map, switchMap, switchMapTo, takeWhile, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CommonCommands } from '../common'
import { summonBehavior } from '../hooks'

import { Arena, ArenaConstructor } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

class RandomIntervalAction<TState = any> extends Action<TState> implements SchedulerAction<TState> {
  constructor(
    private readonly scheduler: RandomIntervalScheduler,
    private readonly work: (this: SchedulerAction<TState>, state?: TState) => void,
  ) {
    super(scheduler as any, work)
  }

  public schedule(state?: TState, delay?: number): Subscription {
    setTimeout(() => this.work(state), randomInt(delay - this.scheduler.variation, delay + this.scheduler.variation))
    return this
  }
}

class RandomIntervalScheduler implements SchedulerLike {

  constructor(public readonly variation: number) {
  }

  public now(): number {
    return Date.now()
  }

  public schedule<T>(work: (this: SchedulerAction<T>, state?: T) => void, delay?: number, state?: T): Subscription {
    return new RandomIntervalAction(this, work).schedule(state, delay)
  }

}

@Arena()
class SurpriseArena extends PlatformArena {

  public static readonly title = text('Surprise!').bold
  public static readonly description = text(`Don't look down, close your eyes...`)

  // public static readonly entryRequirements = [
  //   Arena.requirements.minArenaAge(10),
  // ]
  public static readonly entryRequirements = Arena.requirements.none

  public static readonly exitRequirements = [
    (events: CodslapEvents, arena: SurpriseArena) => arena.run(events)
  ]

  private static readonly minDelay = 20 // seconds
  private static readonly minRadius = 1
  // private static readonly removeRowInterval = 15000 // milliseconds
  private static readonly removeRowInterval = 10000 // milliseconds
  private static readonly removeRowVariation = 5000 // milliseconds
  private static readonly removeRowScheduler = new RandomIntervalScheduler(SurpriseArena.removeRowVariation)
  private static readonly initialRadius = 15

  public readonly layers: PlatformLayer[] = [
    {
      radius: SurpriseArena.initialRadius,
      block: Block.grassBlock,
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

  private currentRadius = SurpriseArena.initialRadius

  constructor(
    @Inject(Client) private client: Client,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common.center)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Arena.requirements.minArenaAge(SurpriseArena.minDelay)(events, this).pipe(
      tap(() => this.logger.debug('minimum arena age met, waiting for next available arena to start shrinking')),
      switchMapTo(events.arenaAvailable$),
      tap(() => this.logger.debug('next arena is available, starting shrink timer')),
      switchMap(() => interval(SurpriseArena.removeRowInterval, SurpriseArena.removeRowScheduler)),
      tap(() => this.logger.debug('shrink timer tick')),
      takeWhile(() => this.currentRadius > SurpriseArena.minRadius),
      this.command(title('@a', text('Watch out!'))),
      map(this.getNextRow.bind(this)),
      delay(1500),
      // FIXME: if a player dies, pause until they respawn or disconnect before continuing
      tap(() => this.currentRadius--),
      this.command(),
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

export const Surprise: ArenaConstructor<SurpriseArena> = SurpriseArena
