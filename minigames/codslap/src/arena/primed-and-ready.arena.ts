import { Inject, Logger } from '@dandi/core'
import { block, rawCmd, text, title } from '@minecraft/core/cmd'
import { Command, parallel, series } from '@minecraft/core/command'
import { randomIntGenerator } from '@minecraft/core/common'
import { CommandOperator, CommandOperatorFn, RandomIntervalScheduler } from '@minecraft/core/common/rxjs'
import { Players } from '@minecraft/core/players'
import { area, Area, Block, Coordinates, loc, Mob } from '@minecraft/core/types'
import { combineLatest, defer, Observable, of, timer } from 'rxjs'
import { delay, map, repeat, switchMap, switchMapTo, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CommonCommands } from '../common'
import { summonBehavior } from '../hooks'

import { Arena, ArenaConstructor } from './arena'
import { ArenaBase, PlatformLayer } from './arena-base'

@Arena()
class PrimedAndReadyArena extends ArenaBase {

  public static readonly title = text('Primed and Ready').bold
  public static readonly description = text(`Watch me exploooooooode!!!`)

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

  public readonly hooks = {
    arenaStart$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
    playerRespawn$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
  }

  private static readonly minDelay = 20 // seconds

  constructor(
    @Inject(CommonCommands) common: CommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Players) private readonly players: Players,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Arena.requirements.minArenaAge(PrimedAndReadyArena.minDelay)(events, this).pipe(

      tap(() => this.logger.debug('minimum arena age met, waiting for next available arena to start exploding')),
      switchMapTo(events.arenaAvailable$),

      tap(() => this.logger.debug('next arena is available, starting explode timer')),

      switchMap(() =>

        // next explosion location - down 2 because spawn locations are up 2 from the floor
        defer(() => of(this.getRandomSpawn().modify.down(2))).pipe(
          events.timedPlayerReadyEvent(this.getTimer.bind(this)),

          map(loc => this.getTntCommand(loc)),
          switchMap(([cmd, tntState]) => combineLatest([this.command()(of(cmd)), of(tntState)])),
          delay(5000),
          map(([,tntState]) => this.replaceBlock(tntState)),
          this.command(),
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
      series(
        block(Block.air).set(coords),
        block(Block.bedrock).set(coords.modify.down(1)),
        rawCmd(`summon ${Block.tnt} ${coords} {"Fuse":80}`),
      ),
      title('@a', text('Watch out!')),
    )
    const blacklistArea = area(
      coords.modify.offset(loc(1, 0, 1)),
      coords.modify.offset(loc(-1, 0, -1)),
    )
    this.blacklistSpawnArea(blacklistArea)
    return [cmd, [coords, blacklistArea]]
  }

  private replaceBlock([loc, blacklistArea]: [Coordinates, Area]): Command {
    this.restoreSpawnArea(blacklistArea)
    return block(Block.bedrock).set(loc)
  }

}

export const PrimedAndReady: ArenaConstructor<PrimedAndReadyArena> = PrimedAndReadyArena
