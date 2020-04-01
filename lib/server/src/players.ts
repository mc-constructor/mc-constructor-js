import { Observable, Observer } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import { loc, Coordinates } from '../../types'
import { isEventType } from './channels'

import { ServerEvents } from './events'
import { ServerAuthenticatorEventType } from './events/auth'
import { ServerThreadEventType } from './events/thread'
import { ServerChannel } from './messages'
import { Inject, Injectable } from '@dandi/core'

export interface Player {
  name: string
  uuid: string
  entityId: number
  ip: string
  startLoc: Coordinates
  joined: true
}

type PendingPlayer = Partial<Player> & { name: string }

function isCompletePlayer(player: PendingPlayer): player is Player {
  return player.name && player.uuid && player.entityId && player.ip && !!player.startLoc
}

@Injectable()
export class Players extends Observable<Player[]> {

  private readonly playersByName: Map<string, Player> = new Map<string, Player>()
  private readonly playersByUuid: Map<string, Player> = new Map<string, Player>()
  private readonly playersByEntityId: Map<number, Player> = new Map<number, Player>()

  private readonly pendingPlayers = new Map<string, PendingPlayer>()

  constructor(
    @Inject(ServerEvents) events$: ServerEvents
  ) {
    super(o => {
      const updatePendingPlayer = this.updatePending.bind(this, o)

      const authSub = events$
        .channel(ServerChannel.authenticator)
        .eventType(ServerAuthenticatorEventType.playerLogin)
        .pipe(
          map(msg => ({
            name: msg.data.player,
            uuid: msg.data.uuid,
          })),
        )
        .subscribe(updatePendingPlayer)

      const thread$ = events$.channel(ServerChannel.thread)

      const loginSub = thread$
        .eventType(ServerThreadEventType.playerLogin)
        .pipe(
          map(msg => ({
            name: msg.data.player,
            entityId: parseInt(msg.data.entityId, 10),
            ip: msg.data.ip,
            startLoc: loc(parseFloat(msg.data.locX), parseFloat(msg.data.locY), parseFloat(msg.data.locZ)),
          })),
        )
        .subscribe(updatePendingPlayer)

      const joinedSub = thread$
        .eventType(ServerThreadEventType.playerJoin)
        .pipe(
          map(msg => ({ name: msg.data.player, joined: true }))
        )
        .subscribe(updatePendingPlayer)

      const threadSub = thread$
        .pipe(
          filter(isEventType(ServerThreadEventType.playerLeft)),
          filter(event => this.playersByName.has(event.data.player))
        )
        .subscribe(event => {
          const player = this.playersByName.get(event.data.player)
          this.playersByName.delete(player.name)
          this.playersByUuid.delete(player.uuid)
          this.playersByEntityId.delete(player.entityId)
          o.next([...this.playersByUuid.values()])
        })

      return () => {
        authSub.unsubscribe()
        joinedSub.unsubscribe()
        loginSub.unsubscribe()
        threadSub.unsubscribe()
      }
    })
  }

  public get players(): Player[] {
    return [...this.playersByName.values()]
  }

  private updatePending(o: Observer<Player[]>, data: PendingPlayer): void {
    if (this.playersByName.has(data.name)) {
      return
    }
    let player = Object.assign(this.pendingPlayers.get(data.name) || {}, data)
    this.pendingPlayers.set(player.name, player)
    if (isCompletePlayer(player)) {
      this.playersByName.set(player.name, player)
      this.playersByUuid.set(player.uuid, player)
      this.playersByEntityId.set(player.entityId, player)
      this.pendingPlayers.delete(player.name)
      o.next([...this.playersByUuid.values()])
    }
  }

}
