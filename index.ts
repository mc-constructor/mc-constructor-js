import { DandiApplication, EntryPoint, Inject, Injectable } from '@dandi/core'
import { ChatCommands } from './lib/chat-commands'
import { ChatCommandsModule } from './lib/chat-commands'
import { Players, ServerEvents, ServerModule } from './lib/server'
import { MinigameModule } from './minigames'
// import { ASCII } from './lib/routines'

require('dotenv').config()

@Injectable(EntryPoint)
class Init implements EntryPoint {

  constructor(
    @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Players) private players$: Players,
    @Inject(ChatCommands) private chatCommands: ChatCommands,
  ) {
    console.log('Init')
  }

  public run(): void {
    console.log('Run')
    this.players$.subscribe() // REQUIRED in order to correctly track players
    this.events$.all.subscribe(event => console.debug(event.source.source.raw))
  }

}

const app = new DandiApplication({
  providers: [
    Init,
    ChatCommandsModule,
    MinigameModule,
    ServerModule,
  ]
})

app.run().catch(console.error.bind(console))
