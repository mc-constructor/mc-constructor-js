import { Constructor, Disposable } from '@dandi/common'
import { Inject, Injectable, Injector, Logger } from '@dandi/core'
import { CommandOperator, CommandOperatorFn } from '@ts-mc/core/command'
import { RequestClient } from '@ts-mc/core/client'
import { defer, from, Observable, of } from 'rxjs'
import { catchError, mapTo, mergeMap, share, tap } from 'rxjs/operators'

import { createGameScope } from './game-scope'
import { getMinigameMeta, Minigame } from './minigame'
import { LoadedGameInfo } from './minigame-loader'

@Injectable()
export class MinigameRunner {

  constructor(
    @Inject(Injector) private injector: Injector,
    @Inject(RequestClient) private client: RequestClient,
    @Inject(CommandOperator) private command: CommandOperatorFn,
    @Inject(Logger) private logger: Logger,
  ) {}

  public runGame(minigame: LoadedGameInfo): Observable<any> {
    return defer(() => {
      this.logger.info(`${minigame.title}: starting`)
      const gameInjector = this.injector.createChild(createGameScope(), minigame.providers)
      minigame.cleanupTasks.push(() => {
        this.logger.info('Disposing gameInjector')
        Disposable.dispose(gameInjector, 'cleanup')
      })
      return from(Disposable.useAsync(gameInjector, async gameInjector => {
        this.logger.debug('invoking game')
        const game$: Observable<void> = await gameInjector.invoke(this as MinigameRunner, 'run')
        this.logger.debug('got game instance, ready to subscribe to event stream')
        return game$
      }))
    }).pipe(
      mergeMap(game$ => game$),
      catchError(err => {
        this.logger.error(err)
        throw err
      }),
      share(),
    )
  }

  public run(@Inject(Minigame) game: Minigame): Observable<any> {
    const gameInfo = getMinigameMeta(game.constructor as Constructor<Minigame>)
    return defer(() => {
      this.logger.debug('run')
      return of(game.validateGameState())
    }).pipe(
      mergeMap(validateCmd => {
        if (validateCmd) {
          return validateCmd.execute(this.client)
        }
        return of(undefined)
      }),
      tap(() => this.logger.info(`${gameInfo.title}: initializing`)),
      this.command(game.init()),
      tap(() => this.logger.info(`${gameInfo.title}: ready`)),
      this.command(game.ready()),
      mapTo(game.run$),
    )
  }
}
