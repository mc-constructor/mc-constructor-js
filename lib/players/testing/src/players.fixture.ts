import { stub } from '@dandi/core/testing'
import { Subject } from 'rxjs'

import { Players } from '../..'
import { ObservableServiceFixture } from '../../../common/testing'
import { Player } from '../../../server'

export type PlayersFixture = ObservableServiceFixture<Players>

export function playersFixture(): PlayersFixture {
  const players$ = new Subject<Player[]>()
  const player$ = new Subject<Player>()
  const playerLeave$ = new Subject<Player>()
  return {
    player$,
    players$,
    playerLeave$,
    hasNamedPlayer: stub(),
    getPlayerByName: stub(),
    players: [],
  }
}
