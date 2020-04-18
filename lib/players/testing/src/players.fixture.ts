import { Subject } from 'rxjs'

import { Players } from '../../index'
import { ObservableServiceFixture } from '../../../common/testing'
import { Player } from '../../../server'

export type PlayersFixture = ObservableServiceFixture<Players>

export function playersFixture(): PlayersFixture {
  const players$ = new Subject<Player[]>()
  return {
    players$,
    hasNamedPlayer(name: string): boolean {
      return false
    },
    players: [],
  }
}
