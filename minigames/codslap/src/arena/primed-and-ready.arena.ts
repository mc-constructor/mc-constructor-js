import { Inject, Logger } from '@dandi/core'
import { RandomIntervalScheduler } from '@ts-mc/common/rxjs'
import { RequestError } from '@ts-mc/core/client'
import { block, rawCmd, summon, text, title } from '@ts-mc/core/cmd'
import { CommandRequest, MapCommand, MapCommandOperatorFn, parallel, series } from '@ts-mc/core/command'
import { area, Area, Block, Coordinates, EntityBlock, loc } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer } from '@ts-mc/minigames/arenas'
import { combineLatest, defer, Observable, of, timer } from 'rxjs'
import { bufferCount, catchError, delay, map, mapTo, repeat, switchMap, switchMapTo, take, tap } from 'rxjs/operators'

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
  private static readonly spawnBlacklistOffset = loc(3, 0, 3)

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

  private static readonly minDelay = 10 // seconds

  constructor(
    @Inject(CodslapCommonCommands) common: CodslapCommonCommands,
    @Inject(MapCommand) private readonly mapCommand: MapCommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    super(common)
  }

  private run(events: CodslapEvents): Observable<any> {
    this.logger.debug('run')
    let count = 1
    return Codslap.requirements.minArenaAge(PrimedAndReadyArena.minDelay)(events, this).pipe(
      tap(() => this.logger.debug('minimum arena age met, waiting for next available arena to start exploding')),
      switchMapTo(events.arenaAvailable$),

      switchMapTo(
        defer(() =>
          of(this.getRandomSpawn().modify.subtractOffset(this.common.spawnOffsetFromFloor)).pipe(
            events.timedPlayerReadyEvent(this.getTimer.bind(this)),
            map(loc => this.getTntCommand(loc)),
            switchMap(([cmd, tntState]) => combineLatest([
              of(cmd).pipe(this.mapCommand(cmd => cmd)),
              of(tntState),
            ])),
            delay(5000),
            this.mapCommand(([,tntState]) => this.replaceBlock(tntState)),
            catchError(err => {
              if (err instanceof RequestError && err.type === 'commands.setblock.failed') {
                // FIXME: why is this error happening?
                this.logger.warn(err)
                return of(undefined)
              }
              throw err
            }),
          ),
        ).pipe(
          tap(() => {
            console.log('boom #', count++)
          }),
          repeat(),
        ),
      ),
      bufferCount(PrimedAndReadyArena.explosionCount),
    )
  }

  private getTimer(): Observable<true> {
    return timer(PrimedAndReadyArena.explosionInterval, PrimedAndReadyArena.explosionScheduler).pipe(
      tap(() => this.logger.debug('explosion timer tick')),
      mapTo(true),
    )
  }

  private getTntCommand(coords: Coordinates): [CommandRequest, [Coordinates, Area]] {
    const cmd = parallel(
      series(
        block(Block.air).set(coords),
        block(Block.bedrock).set(coords.modify.down(1)),
        summon(EntityBlock.tnt, coords, { Fuse: 80 }),
        rawCmd(`summon ${Block.tnt} ${coords} {"Fuse":80}`),
      ),
      title('@a', text('Watch out!')),
    )
    const blacklistArea = area(
      coords.modify.offset(PrimedAndReadyArena.spawnBlacklistOffset),
      coords.modify.subtractOffset(PrimedAndReadyArena.spawnBlacklistOffset),
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
