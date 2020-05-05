import { stub } from '@dandi/core/testing'
import { Subject } from 'rxjs'

import { ObservableServiceFixture } from '@ts-mc/common/testing'
import { Player } from '@ts-mc/core/types'

import { Players } from '../../index'

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
