import { stub } from '@dandi/core/testing'
import { ObservableServiceFixture } from '@ts-mc/common/testing'
import { PlayerEvents } from '@ts-mc/core/server-events'
import { Player } from '@ts-mc/core/types'
import { Subject } from 'rxjs'

export type PlayerEventsFixture = ObservableServiceFixture<PlayerEvents>

export function playerEventsFixture(): PlayerEventsFixture {
  const players$ = new Subject<Player[]>()
  const player$ = new Subject<Player>()
  const playerLeave$ = new Subject<Player>()
  const players: Player[] = []
  return {
    player$,
    players$,
    playerLeave$,
    hasNamedPlayer: stub<[string], boolean>().callsFake(name => players.some(p => p.name === name)),
    getPlayerByName: stub<[string], Player>().callsFake(name => players.find(p => p.name === name)),
    players,
  }
}
