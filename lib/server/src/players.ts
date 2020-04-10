import { Uuid } from '@dandi/common'
import { Inject, Injectable } from '@dandi/core'
import { merge, Observable, Observer } from 'rxjs'
import { map, share, tap } from 'rxjs/operators'

import { listPlayers } from '../../cmd'

import { Client } from './client'
import { eventType, PlayerEvent, ServerEvents, ServerEventType } from './events'

export interface Player {
  name: string
  uuid: Uuid
}

@Injectable()
export class Players extends Observable<Player[]> {

  private readonly playersByName: Map<string, Player> = new Map<string, Player>()
  private readonly playersByUuid: Map<Uuid, Player> = new Map<Uuid, Player>()

  private readonly players$: Observable<Player[]>

  constructor(
    @Inject(Client) client: Client,
    @Inject(ServerEvents) events$: ServerEvents,
  ) {
    super(o => {
      const sub = this.players$.subscribe(o)
      this.init(client, o)

      return () => {
        sub.unsubscribe()
        this.playersByName.clear()
        this.playersByUuid.clear()
      }
    })

    const playerJoin$ = events$.pipe(
      eventType(ServerEventType.playerJoined),
      tap(this.onPlayerJoin.bind(this)),
    )
    const playerLeave$ = events$.pipe(
      eventType(ServerEventType.playerLeft),
      tap(this.onPlayerLeave.bind(this))
    )

    this.players$ = merge(playerJoin$, playerLeave$).pipe(
      map(() => this.players),
      share(),
    )
  }

  public get players(): Player[] {
    return [...this.playersByName.values()]
  }

  public hasNamedPlayer(name: string): boolean {
    return this.playersByName.has(name)
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
