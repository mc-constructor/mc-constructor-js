import { DandiApplication, LogLevel } from '@dandi/core'
import { ConsoleLogListener, LoggingModule } from '@dandi/core/logging'
import { PrettyColorsLogging } from '@dandi/logging'
import { CommandModule } from '@ts-mc/core/command'
import { ClientModule } from '@ts-mc/core/client'
import { ScoreboardModule } from '@ts-mc/core/scoreboard'
import { ServerEventsModule } from '@ts-mc/core/server-events'
import { MinigameManagementModule } from '@ts-mc/minigames'

require('dotenv').config()

const app = new DandiApplication({
  providers: [
    ClientModule,
    CommandModule,
    LoggingModule.use(ConsoleLogListener),
    MinigameManagementModule,
    PrettyColorsLogging.set({ filter: LogLevel.debug }),
    ScoreboardModule,
    ServerEventsModule,
  ]
})
app.run().catch(console.error.bind(console))
