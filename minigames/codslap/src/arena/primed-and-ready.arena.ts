import { Inject, Logger } from '@dandi/core'
import { block, text, title } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { CommandOperator, CommandOperatorFn, RandomIntervalScheduler } from '@minecraft/core/common/rxjs'
import { Players } from '@minecraft/core/players'
import { area, Area, Block, Coordinates, loc } from '@minecraft/core/types'
import { combineLatest, Observable, of, timer } from 'rxjs'
import { map, repeat, switchMap, switchMapTo, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CommonCommands } from '../common'

import { Arena, ArenaConstructor } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

@Arena()
class PrimedAndReadyArena extends PlatformArena {

  public static readonly title = text('Shrinky Dinks!').bold
  public static readonly description = text(`Keep an eye on the edges...`)

  // public static readonly entryRequirements = [
  //   Arena.requirements.minArenaAge(300),
  // ]
  public static readonly entryRequirements = Arena.requirements.none

  public static readonly exitRequirements = [
    (events: CodslapEvents, arena: PrimedAndReadyArena) => arena.run(events)
  ]

  private static readonly explosionInterval = 5000
  private static readonly explosionIntervalVariation = 5000
  private static readonly explosionCount = 30
  private static readonly removeRowScheduler = new RandomIntervalScheduler(PrimedAndReadyArena.explosionIntervalVariation)

  public readonly layers: PlatformLayer[] = [
    {
      block: block(Block.bedrock),
      radius: 15,
      depth: 1,
      centerOffset: loc(0, 25, 0),
    },
  ]

  private static readonly minDelay = 20 // seconds

  constructor(
    @Inject(CommonCommands) common: CommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Players) private readonly players: Players,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common.center)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Arena.requirements.minArenaAge(PrimedAndReadyArena.minDelay)(events, this).pipe(

      tap(() => this.logger.debug('minimum arena age met, waiting for next available arena to start exploding')),
      switchMapTo(events.arenaAvailable$),

      tap(() => this.logger.debug('next arena is available, starting explode timer')),

      switchMap(() =>

        // next explosion location
        of(this.getRandomSpawn()).pipe(
          events.timedPlayerReadyEvent(this.getTimer.bind(this)),

          map(loc => this.getTntCommand(loc)),
          switchMap(([cmd, tntState]) => combineLatest([this.command()(of(cmd)), of(tntState)])),
          map(([,tntState]) => this.replaceBlock(tntState)),
      )),

      repeat(PrimedAndReadyArena.explosionCount),
    )
  }

  private getTimer(): Observable<true> {
    return timer(PrimedAndReadyArena.explosionInterval, PrimedAndReadyArena.removeRowScheduler).pipe(
      tap(() => this.logger.debug('shrink timer tick')),
      map(() => true),
    )
  }


  private getTntCommand(coords: Coordinates): [Command, [Coordinates, Area]] {
    const cmd = parallel(
      block(Block.tnt).set(coords),
      title('@a', text('Watch out!')),
    )
    const blacklistArea = area(
      coords.modify.offset(loc(1, 1, 1)),
      coords.modify.offset(loc(-1, 0, -1)),
    )
    this.spawnBlacklist.push(blacklistArea)
    return [cmd, [coords, blacklistArea]]
  }

  private replaceBlock([loc, blacklistArea]: [Coordinates, Area]): Command {
    this.spawnBlacklist.splice(this.spawnBlacklist.indexOf(blacklistArea), 1)
    return block(Block.bedrock).set(loc)
  }

}

export const PrimedAndReady: ArenaConstructor<PrimedAndReadyArena> = PrimedAndReadyArena
