import { DandiApplication, EntryPoint, Inject, Injectable } from '@dandi/core'

import { gamerule, give, item, listPlayers, rawCmd } from './lib/cmd'
// import { ChatCommandsModule } from './lib/chat-commands'
import { Client, Players, ServerModule } from './lib/server'
import { Item } from './lib/types'
// import { MinigameModule } from './minigames'
// import { ASCII } from './lib/routines'

require('dotenv').config()

@Injectable(EntryPoint)
class Init implements EntryPoint {

  constructor(
    // @Inject(ServerEvents) private events$: ServerEvents,
    @Inject(Players) private players$: Players,
    // @Inject(ChatCommands) private chatCommands: ChatCommands,
    @Inject(Client) private readonly client$: Client
  ) {
    console.log('Init')
  }

  public async run(): Promise<void> {
    console.log('Run')
    this.client$.subscribe(console.log.bind(console, 'client:'))
    this.players$.subscribe(console.log.bind(console, 'Players')) // REQUIRED in order to correctly track players
    // this.client$.send('cmd\nsay hi')
    // gamerule.doWeatherCycle.disable.execute(this.client$)
    console.log(await give('@p', item(Item.cod), 2).execute(this.client$))
    // this.events$.all.subscribe(event => console.debug(event.source.source.raw))
  }

}

const app = new DandiApplication({
  providers: [
    Init,
    // ChatCommandsModule,
    // MinigameModule,
    ServerModule,
  ]
})
app.run().catch(console.error.bind(console))