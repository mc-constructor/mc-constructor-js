import { Uuid } from '@dandi/common'
import { Inject, Injectable, Logger } from '@dandi/core'
import { dequeueReplay } from '@ts-mc/common/rxjs'
import { RequestClient } from '@ts-mc/core/client'
import { listPlayers } from '@ts-mc/core/cmd'
import { eventType, PlayerEvent, ServerEvents, ServerEventType } from '@ts-mc/core/server-events'
import { Player } from '@ts-mc/core/types'
import { defer, merge, Observable } from 'rxjs'
import { map, share, tap } from 'rxjs/operators'

@Injectable()
export class Players {

  private readonly playersByName: Map<string, Player> = new Map<string, Player>()
  private readonly playersByUuid: Map<Uuid, Player> = new Map<Uuid, Player>()

  public readonly player$: Observable<Player>
  public readonly playerLeave$: Observable<Player>
  public readonly players$: Observable<Player[]>

  constructor(
    @Inject(RequestClient) client: RequestClient,
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(Logger) private logger: Logger,
  ) {
    logger.debug('ctr')
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

    // FIXME: refactor this to pipe instead of subscribe?
    const init$ = this.init(client)

    this.players$ = merge(init$, playerJoin$, this.playerLeave$).pipe(
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

  public getPlayerByName(name: string): Player {
    return this.playersByName.get(name)
  }

  private init(client: RequestClient): Observable<Player[]> {
    return defer(() => listPlayers(true).execute(client)).pipe(
      map(result => {
        result.players.forEach(this.addPlayer.bind(this))
        return result.players
      }),
      share(),
    )
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
