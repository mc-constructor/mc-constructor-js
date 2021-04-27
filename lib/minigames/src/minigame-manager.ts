import { Inject, Injectable, Logger } from '@dandi/core'
import { silence } from '@ts-mc/common/rxjs'
import { RequestClient } from '@ts-mc/core/client'
import { MapCommand, MapCommandOperatorFn } from '@ts-mc/core/command'
import { MinigameStartEvent, ServerEvents, ServerEventType } from '@ts-mc/core/server-events'
import { combineLatest, defer, Observable, of, merge, EMPTY } from 'rxjs'
import { bufferCount, catchError, map, mergeMap, pluck, share, switchMapTo, tap } from 'rxjs/operators'

import { register, unregister } from './cmd/register-minigame'
import { GameInfo, MinigameLoader } from './minigame-loader'
import { MinigameRunner } from './minigame-runner'

export interface MinigameRunEvent {
  source: string
  event: any
}

@Injectable()
export class MinigameManager {

  public readonly run$: Observable<MinigameRunEvent>

  private readonly games = new Map<string, GameInfo>()

  constructor(
    @Inject(RequestClient) private client: RequestClient,
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(MinigameLoader) private loader: MinigameLoader,
    @Inject(MinigameRunner) private runner: MinigameRunner,
    @Inject(MapCommand) private mapCommand: MapCommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {
    const initMinigames$ = this.init().pipe(
      switchMapTo(this.listenForMinigameStart()),
      share(),
    )
    this.run$ = merge(
      initMinigames$.pipe(map(event => ({ source: 'minigame', event }))),

      // these are required to ensure incoming messages
      // but don't spam the output with all the events
      this.events$.run$.pipe(silence),
    ).pipe(
      catchError(err => {
        logger.error(err)
        return EMPTY
      }),
      share(),
    )
  }

  public startGame(event: MinigameStartEvent): Observable<any> {
    return defer(() => {
      const game = this.games.get(event.key)
      if (!game) {
        throw new Error(`No game with key ${event.key}`)
      }

      const loadedGame = this.loader.loadMinigame(game)
      this.games.set(game.key, loadedGame)

      return this.runner.runGame(loadedGame)
    }).pipe(share())
  }

  // FIXME: where's this get called from?
  public cleanup(): Observable<any> {
    return defer(() => of(...this.games.values())).pipe(
      mergeMap(game => {
        const unregCmd$ = unregister(game).execute(this.client)
        return combineLatest([of(game), unregCmd$])
      }),
      tap(([game]) => this.games.delete(game.key)),
      share(),
    )
  }

  protected listenForMinigameStart(): Observable<any> {
    return this.events$.eventStream(ServerEventType.minigameStart).pipe(
      mergeMap(this.startGame.bind(this)),
      share(),
    )
  }

  protected init(): Observable<GameInfo[]> {
    const games = this.loader.listGames()
    return defer(() => of(...games)).pipe(
      mergeMap(game => {
        const regCmd$ = register(game).execute(this.client)
        return combineLatest([of(game), regCmd$])
      }),
      pluck(0),
      tap(game => this.games.set(game.key, game)),
      bufferCount(games.length),
      share(),
    )
  }

}
