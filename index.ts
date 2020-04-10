import { DandiApplication, EntryPoint, Inject, Injectable } from '@dandi/core'
import { tap } from 'rxjs/operators'
import { ChatCommands, ChatCommandsModule } from './lib/chat-commands'
import { Client, Players, ServerModule } from './lib/server'
import { MinigameModule } from './minigames'

require('dotenv').config()

@Injectable(EntryPoint)
class Init implements EntryPoint {

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(Client) private readonly client: Client,
    @Inject(ChatCommands) private readonly cmds: ChatCommands,
  ) {
    console.log('Init')
  }

  public async run(): Promise<void> {
    this.players$.pipe(
      tap(players => {
        if (players.length) {
          this.cmds.commands['game'].exec(['start', 'codslap'])
        }
      })
    )
      .subscribe(console.log.bind(console, 'Players')) // REQUIRED in order to correctly track players

    // block(Block.oakWood).fill(loc(-140, 99, -61), loc(-40, 149, -21)).execute(this.client)
    // rawCmd('fill -84 99 -61 -97 149 -21 oak_wood').execute(this.client)
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
