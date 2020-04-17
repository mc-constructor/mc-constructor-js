import { Constructor, Disposable } from '@dandi/common'
import { Inject, Injectable, Injector, Logger } from '@dandi/core'
import { Client } from '@minecraft/core/server'
import { Observer } from 'rxjs'

import { createGameScope } from './game-scope'
import { getMinigameMeta, Minigame } from './minigame'
import { LoadedGameInfo } from './minigame-loader'

@Injectable()
export class MinigameRunner {

  constructor(
    @Inject(Injector) private injector: Injector,
    @Inject(Client) private client: Client,
    @Inject(Logger) private logger: Logger,
  ) {
  }

  public async runGame(minigame: LoadedGameInfo) {
    this.logger.info(`${minigame.title}: starting`)
    const gameInjector = this.injector.createChild(createGameScope(), minigame.providers)
    minigame.cleanupTasks.push(() => {
      this.logger.info('Disposing gameInjector')
      Disposable.dispose(gameInjector, 'cleanup')
    })
    await Disposable.useAsync(gameInjector, async gameInjector => {
      await gameInjector.invoke(this as MinigameRunner, 'run')
    })
  }

  public async run(@Inject(Minigame) game: Minigame): Promise<void> {
    const validate = game.validateGameState()
    const gameInfo = getMinigameMeta(game.constructor as Constructor<Minigame>)
    if (validate) {
      await validate.execute(this.client)
    }
    try {
      this.logger.info(`${gameInfo.title}: initializing`)
      await game.init.execute(this.client)
    } catch (err) {
      this.logger.error(err)
    }
    this.logger.info(`${gameInfo.title}: ready`)
    await game.ready().execute(this.client)

    return new Promise<void>(resolve => {
      const gameObserver: Observer<any> = {
        next: () => {},
        error: this.logger.error.bind(this.logger),
        complete: resolve,
      }
      game.run.subscribe(gameObserver)
    })
  }
}
