import { Disposable } from '@dandi/common'
import { Inject, Injectable, Injector } from '@dandi/core'
import { Client } from '@minecraft/core/server'

import { createGameScope } from './game-scope'
import { Minigame } from './minigame'
import { LoadedGameInfo } from './minigame-loader'

@Injectable()
export class MinigameRunner {

  constructor(
    @Inject(Injector) private injector: Injector,
    @Inject(Client) private client: Client,
  ) {
  }

  public async runGame(minigame: LoadedGameInfo) {
    await Disposable.useAsync(this.injector.createChild(createGameScope(), minigame.providers), async gameInjector => {
      await gameInjector.invoke(this as MinigameRunner, 'run')
    })
  }


  public async run(@Inject(Minigame) game: Minigame): Promise<void> {
    const validate = game.validateGameState()
    if (validate) {
      await validate.execute(this.client)
    }
    try {
      await game.init.execute(this.client)
    } catch (err) {
      console.error(err)
    }
    console.log('game ready!')
    await game.ready().execute(this.client)
  }
}
