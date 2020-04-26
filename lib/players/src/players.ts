import { Uuid } from '@dandi/common'
import { Inject, Injectable, Logger } from '@dandi/core'
import { merge, Observable } from 'rxjs'
import { map, share, tap } from 'rxjs/operators'

import { listPlayers } from '../../cmd'
import { dequeueReplay } from '../../common/rxjs'
import { Client, eventType, Player, PlayerEvent, ServerEvents, ServerEventType } from '../../server'

@Injectable()
export class Players {

  private readonly playersByName: Map<string, Player> = new Map<string, Player>()
  private readonly playersByUuid: Map<Uuid, Player> = new Map<Uuid, Player>()

  public readonly player$: Observable<Player>
  public readonly playerLeave$: Observable<Player>
  public readonly players$: Observable<Player[]>

  constructor(
    @Inject(Client) client: Client,
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(Logger) private logger: Logger,
  ) {
    const playerJoin$ = events$.pipe(
      eventType(ServerEventType.playerJoined),
      tap(this.onPlayerJoin.bind(this)),
      share(),
    )
    this.playerLeave$ = events$.pipe(
      eventType(ServerEventType.playerLeft),
      tap(this.onPlayerLeave.bind(this)),
      map(event => event.player),
    )
    this.player$ = playerJoin$.pipe(
      map(event => event.player),
      dequeueReplay(this.playerLeave$),
    )

    const init$ = new Observable<void>(o => {
      this.init(client).then(() => o.next())
      return () => {
        this.playersByName.clear()
        this.playersByUuid.clear()
      }
    })

    this.players$ = merge(init$, playerJoin$, this.playerLeave$).pipe(
      map(() => this.players),
      share(),
    )
  }

  public get players(): Player[] {
    return [...this.playersByName.values()]
  }

  public hasNamedPlayer(name: string): boolean {
    if (!this.playersByName.has(name)) {
      this.logger.debug('no player named', name)
    }
    return this.playersByName.has(name)
  }

  public getPlayerByName(name: string): Player {
    return this.playersByName.get(name)
  }

  private async init(client: Client): Promise<Player[]> {
    const playerList = await listPlayers(true).execute(client)
    playerList.players.forEach(this.addPlayer.bind(this))
    return this.players
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
