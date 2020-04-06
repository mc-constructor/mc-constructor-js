import { Uuid } from '@dandi/common'
import { Inject, Injectable } from '@dandi/core'
import { merge, Observer } from 'rxjs'
import { map, share, tap } from 'rxjs/operators'

import { listPlayers } from '../../cmd'
import { SharedObservable } from '../../common'

import { Client } from './client'
import { eventType, PlayerEvent, ServerEvents, ServerEventType } from './events'

export interface Player {
  name: string
  uuid: Uuid
}

@Injectable()
export class Players extends SharedObservable<Player[]> {

  private readonly playersByName: Map<string, Player> = new Map<string, Player>()
  private readonly playersByUuid: Map<Uuid, Player> = new Map<Uuid, Player>()

  constructor(
    @Inject(Client) client: Client,
    @Inject(ServerEvents) events$: ServerEvents,
  ) {
    super(o => {
      const source$ = events$.pipe(share())

      const playerJoin$ = source$.pipe(
        eventType(ServerEventType.playerJoined),
        tap(this.onPlayerJoin.bind(this)),
      )
      const playerLeave$ = source$.pipe(
        eventType(ServerEventType.playerLeft),
        tap(this.onPlayerLeave.bind(this))
      )

      this.init(client, o)

      const sub = merge(playerJoin$, playerLeave$).pipe(map(() => this.players)).subscribe(o)

      return () => {
        sub.unsubscribe()
        this.playersByName.clear()
        this.playersByUuid.clear()
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

  private onPlayerJoin(event: PlayerEvent): void {
    this.addPlayer(event.player)
  }

  private onPlayerLeave(event: PlayerEvent): void {
    this.removePlayer(event.player)
  }

  private addPlayer(player: Player): void {
    this.playersByName.set(player.name, player)
    this.playersByUuid.set(player.uuid, player)
  }

  private removePlayer(player: Player): void {
    if (!player) {
      return
    }
    this.playersByName.delete(player.name)
    this.playersByUuid.delete(player.uuid)
  }

}