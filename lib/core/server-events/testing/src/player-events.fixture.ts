import { stub } from '@dandi/core/testing'
import { ObservableServiceFixture } from '@ts-mc/common/testing'
import { PlayerEvent, PlayerEvents } from '@ts-mc/core/server-events'
import { Player } from '@ts-mc/core/types'
import { defer, of, Subject } from 'rxjs'
import { distinctUntilChanged, map } from 'rxjs/operators'

export type PlayerEventsFixture = ObservableServiceFixture<PlayerEvents>

export function playerEventsFixture(): PlayerEventsFixture {
  const players: Player[] = []
  const player$ = new Subject<Player>()
  const players$ = defer(() => of(players))
  const playerLeave$ = new Subject<PlayerEvent>()
  const playerJoin$ = new Subject<PlayerEvent>()
  const hasPlayers$ = players$.pipe(map(players => players.length > 0), distinctUntilChanged())
  return {
    player$,
    players$,
    playerLeave$,
    playerJoin$,
    hasPlayers$,
    hasNamedPlayer: stub<[string], boolean>().callsFake(name => players.some(p => p.name === name)),
    getPlayerByName: stub<[string], Player>().callsFake(name => players.find(p => p.name === name)),
    players,
  }
}
