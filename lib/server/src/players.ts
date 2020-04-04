import { Inject, Injectable, InjectionToken, Provider } from '@dandi/core'
import { Observable, Observer } from 'rxjs'
import { shareReplay } from 'rxjs/operators'

import { listPlayers } from '../../cmd'

import { Client } from './client'
import { ServerEvents } from './events'
import { localToken } from './local-token'

export interface Player {
  name: string
  uuid: string
}

@Injectable()
export class PlayersService extends Observable<Player[]> {

  private readonly playersByName: Map<string, Player> = new Map<string, Player>()
  private readonly playersByUuid: Map<string, Player> = new Map<string, Player>()

  constructor(
    @Inject(Client) client: Client,
    // @Inject(ServerEvents) events$: ServerEvents
  ) {
    super(o => {
      this.playersByName.clear()
      this.playersByUuid.clear()
      this.init(client, o)

      return () => {
      }
    })
  }

  public get players(): Player[] {
    return [...this.playersByName.values()]
  }

  private async init(client: Client, o: Observer<Player[]>): Promise<void> {
    const playerList = await listPlayers(true).execute(client)
    playerList.players.forEach(this.addPlayer.bind(this))
    o.next(this.players)
  }

  private addPlayer(player: Player): void {
    this.playersByName.set(player.name, player)
    this.playersByUuid.set(player.uuid, player)
  }

  private removePlayer(name: string): void {
    const player = this.playersByName.get(name)
    if (!player) {
      return
    }
    this.playersByName.delete(player.name)
    this.playersByUuid.delete(player.uuid)
  }

}

export interface Players extends Observable<Player[]> {
  readonly players: ReadonlyArray<Player>
}
export const Players: InjectionToken<Players> = localToken.opinionated<Players>('Players', {
  multi: false,
})

export const PlayersProvider: Provider<Players> = {
  provide: Players,
  useFactory(players: PlayersService): Players {
    return Object.defineProperties(players.pipe(shareReplay(1)), {
      players: {
        get: () => players.players,
      },
    })
  },
  deps: [PlayersService]
}
