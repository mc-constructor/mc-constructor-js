import { Inject, Logger } from '@dandi/core'
import { RandomIntervalScheduler } from '@ts-mc/common/rxjs'
import { RequestError } from '@ts-mc/core/client'
import { block, rawCmd, text, title } from '@ts-mc/core/cmd'
import { CommandRequest, CommandOperator, CommandOperatorFn, parallel, series } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { area, Area, Block, Coordinates, loc } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer } from '@ts-mc/minigames/arenas'
import { combineLatest, defer, Observable, of, timer } from 'rxjs'
import { catchError, delay, map, repeat, switchMap, switchMapTo, tap } from 'rxjs/operators'

import { CodslapEvents } from '../codslap-events'
import { CodslapCommonCommands } from '../codslap-common-commands'
import { Codslap } from '../codslap-static'

@Arena()
class PrimedAndReadyArena extends ArenaBase<CodslapEvents, CodslapCommonCommands> {

  public static readonly title = text('Primed and Ready').bold
  public static readonly description = text(`Watch me exploooooooode!!!`)

  public readonly exitRequirements = [
    (events: CodslapEvents, arena: PrimedAndReadyArena) => arena.run(events)
  ]

  private static readonly explosionInterval = 5000
  private static readonly explosionIntervalVariation = 5000
  private static readonly explosionCount = 30
  private static readonly explosionScheduler = new RandomIntervalScheduler(PrimedAndReadyArena.explosionIntervalVariation)

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
      this.common.summonCowsOnStartBehavior,
    ],
    playerRespawn$: [
      this.common.summonCowsOnRespawnBehavior,
    ],
  }

  private static readonly minDelay = 20 // seconds

  constructor(
    @Inject(CodslapCommonCommands) common: CodslapCommonCommands,
    @Inject(CommandOperator) private readonly command: CommandOperatorFn,
    @Inject(Players) private readonly players: Players,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    return Codslap.requirements.minArenaAge(PrimedAndReadyArena.minDelay)(events, this).pipe(
      tap(() => this.logger.debug('minimum arenas age met, waiting for next available arenas to start exploding')),
      switchMapTo(events.arenaAvailable$),

      switchMap(() =>

        // next explosion location - down 1 because spawn locations are up 1 from the floor
        defer(() => of(this.getRandomSpawn().modify.down(1))).pipe(
          events.timedPlayerReadyEvent(this.getTimer.bind(this)),

          map(loc => this.getTntCommand(loc)),
          switchMap(([cmd, tntState]) => combineLatest([of(cmd).pipe(this.command()), of(tntState)])),
          delay(6000),
          map(([,tntState]) => this.replaceBlock(tntState)),
          this.command(),
          catchError(err => {
            if (err instanceof RequestError && err.type === 'commands.setblock.failed') {
              // FIXME: why is this error happening?
              this.logger.warn(err)
              return of(undefined)
            }
            throw err
          }),
          repeat(PrimedAndReadyArena.explosionCount),
      )),
    )
  }

  private getTimer(): Observable<true> {
    return timer(PrimedAndReadyArena.explosionInterval, PrimedAndReadyArena.explosionScheduler).pipe(
      tap(() => this.logger.debug('explosion timer tick')),
      map(() => true),
    )
  }

  private getTntCommand(coords: Coordinates): [CommandRequest, [Coordinates, Area]] {
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

  private replaceBlock([loc, blacklistArea]: [Coordinates, Area]): CommandRequest {
    this.restoreSpawnArea(blacklistArea)
    return block(Block.bedrock).set(loc)
  }

}

export const PrimedAndReady: ArenaConstructor<CodslapEvents, PrimedAndReadyArena> = PrimedAndReadyArena
