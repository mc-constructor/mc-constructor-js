import { DandiApplication, EntryPoint, Inject, Injectable, Logger, LogLevel } from '@dandi/core'
import { ConsoleLogListener, LoggingModule } from '@dandi/core/logging'
import { PrettyColorsLogging } from '@dandi/logging'
import { CommonModule, LoggerFactory } from '@ts-mc/common'
import { ClientModule, RequestClient } from '@ts-mc/core/client'
import { Players, PlayersModule } from '@ts-mc/core/players'
import { ScoreboardModule } from '@ts-mc/core/scoreboard'
import { ServerEventsModule } from '@ts-mc/core/server-events'
import { MinigameManager, MinigameModule } from '@ts-mc/minigames'

require('dotenv').config()

@Injectable(EntryPoint)
class Init implements EntryPoint {

  constructor(
    @Inject(Players) private players: Players,
    @Inject(RequestClient) private readonly client: RequestClient,
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
    ClientModule,
    CommonModule,
    Init,
    LoggingModule.use(ConsoleLogListener),
    MinigameModule,
    PlayersModule,
    PrettyColorsLogging.set({ filter: LogLevel.debug }),
    ScoreboardModule,
    ServerEventsModule,
  ]
})
app.run().catch(console.error.bind(console))
