import { InjectionToken } from '@dandi/core'
import { GameScope, MinigameEvents } from '@ts-mc/minigames'
import { Observable } from 'rxjs'

import { ConfiguredArena } from './arena'
import { localToken } from './local-token'

export interface ArenaManagerEvents<TEvents extends MinigameEvents> {
  readonly arenaAvailable$: Observable<ConfiguredArena<TEvents>>
  readonly arenaComplete$: Observable<ConfiguredArena<TEvents>>
  readonly arenaInit$: Observable<ConfiguredArena<TEvents>>
  readonly arenaStart$: Observable<ConfiguredArena<TEvents>>
  readonly pendingArenas$: Observable<Set<ConfiguredArena<TEvents>>>
  readonly lastArena$: Observable<void>
}

export const ArenaManagerEvents: InjectionToken<ArenaManagerEvents<any>> = localToken.opinionated('ArenaManagerEvents', {
  multi: false,
  restrictScope: GameScope,
})
