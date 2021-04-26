import { Logger } from '@dandi/core'
import { dequeueReplay } from '@ts-mc/common/rxjs'
import { RequestClient } from '@ts-mc/core/client'
import { listPlayers } from '@ts-mc/core/cmd'
import { Player } from '@ts-mc/core/types'
import { defer, merge, Observable } from 'rxjs'
import { map, share, tap, shareReplay, distinctUntilChanged, pluck } from 'rxjs/operators'

import { PlayerEvent } from './player-event'
import { ServerEventType } from './server-event-type'
import { ServerEvents } from './server-events'

export class PlayerEvents {

  protected readonly playersByName: Map<string, Player> = new Map<string, Player>()
  protected readonly playersByUuid: Map<string, Player> = new Map<string, Player>()

  public readonly player$: Observable<Player>
  public readonly playerJoin$: Observable<PlayerEvent>
  public readonly playerLeave$: Observable<PlayerEvent>
  public readonly players$: Observable<Player[]>
  public readonly hasPlayers$: Observable<boolean>

  constructor(
    protected readonly client: RequestClient,
    protected readonly events: ServerEvents,
    protected readonly logger: Logger,
  ) {
    logger.debug('ctr')
    this.playerJoin$ = events.eventStream(ServerEventType.playerJoined).pipe(
      tap(this.onPlayerJoin.bind(this)),
      share(),
    )
    this.playerLeave$ = events.eventStream(ServerEventType.playerLeft).pipe(
      tap(this.onPlayerLeave.bind(this)),
      share(),
    )
    this.player$ = this.playerJoin$.pipe(
      map(event => event.player),
      dequeueReplay(this.playerLeave$.pipe(pluck('player'))),
    )

    const init$ = this.init(client)

    this.players$ = merge(init$, this.playerJoin$, this.playerLeave$).pipe(
      map(() => this.players),
      shareReplay(1),
    )
    this.hasPlayers$ = this.players$.pipe(
      map(players => players.length > 0),
      distinctUntilChanged(),
      shareReplay(1),
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

  protected addPlayer(player: Player): void {
    this.playersByName.set(player.name, player)
    this.playersByUuid.set(player.uuid, player)
  }

  protected removePlayer(player: Player): void {
    if (!player) {
      return
    }
    this.playersByName.delete(player.name)
    this.playersByUuid.delete(player.uuid)
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

  protected getRunStreams(): Observable<any>[] {
    return [
      this.players$,
    ]
  }

}
