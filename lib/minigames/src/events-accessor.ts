import { InjectionToken } from '@dandi/core'

import { GameScope } from './game-scope'
import { localToken } from './local-token'
import { MinigameEvents } from './minigame-events'

export interface Accessor<T> {
  (host: any, key: string): void
}

export const EventsAccessor: InjectionToken<Accessor<MinigameEvents>> = localToken.opinionated('EventsAccessor', {
  multi: false,
  restrictScope: GameScope,
})
