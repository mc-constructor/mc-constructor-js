import { DandiApplication, EntryPoint, Inject, Injectable } from '@dandi/core'
import { tap } from 'rxjs/operators'
import { Client, Players, ServerModule } from './lib/server'
import { MinigameManager, MinigameModule } from './minigames'

require('dotenv').config()

@Injectable(EntryPoint)
class Init implements EntryPoint {

  constructor(
    @Inject(Players) private players: Players,
    @Inject(Client) private readonly client: Client,
    @Inject(MinigameManager) private readonly minigame: MinigameManager,
  ) {
    console.log('Init')
  }

  public async run(): Promise<void> {
    this.players.players$.pipe(
      tap(players => {
        if (players.length) {
          // this.cmds.commands['game'].exec(['start', 'codslap'])
          // this.minigame.startGame('codslap')
        }
      })
    )
      .subscribe(console.log.bind(console, 'Players')) // REQUIRED in order to correctly track players
    this.minigame.minigame$.subscribe();
  }

}

const app = new DandiApplication({
  providers: [
    Init,
    MinigameModule,
    ServerModule,
  ]
})
app.run().catch(console.error.bind(console))
