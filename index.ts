import { DandiApplication, EntryPoint, Inject, Injectable, Logger, LogLevel } from '@dandi/core'
import { ConsoleLogListener, LoggingModule } from '@dandi/core/logging'
import { PrettyColorsLogging } from '@dandi/logging'

import { CommonModule, LoggerFactory } from './lib/common'
import { Players, PlayersModule } from './lib/players'
import { ScoreboardModule } from './lib/scoreboard'
import { Client, ServerModule } from './lib/client'
import { MinigameManager, MinigameModule } from './minigames'

require('dotenv').config()

@Injectable(EntryPoint)
class Init implements EntryPoint {

  constructor(
    @Inject(Players) private players: Players,
    @Inject(Client) private readonly client: Client,
    @Inject(MinigameManager) private readonly minigame: MinigameManager,
    @Inject(Logger) private logger: Logger,
    @Inject(LoggerFactory) loggerFactory: LoggerFactory,
  ) {
    this.logger.info('ctr')
    loggerFactory.init()
  }

  public async run(): Promise<void> {
    this.players.players$.subscribe(this.logger.debug.bind(this.logger, 'Players')) // REQUIRED in order to correctly track players
    this.minigame.minigame$.subscribe()
  }

}

const app = new DandiApplication({
  providers: [
    CommonModule,
    Init,
    LoggingModule.use(ConsoleLogListener),
    MinigameModule,
    PlayersModule,
    PrettyColorsLogging.set({ filter: LogLevel.debug }),
    ScoreboardModule,
    ServerModule,
  ]
})
app.run().catch(console.error.bind(console))
