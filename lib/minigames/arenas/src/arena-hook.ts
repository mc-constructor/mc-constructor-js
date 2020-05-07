import { MinigameEvents } from '@ts-mc/minigames'
import { Observable } from 'rxjs'

import { HookHandler } from './behaviors'

export type ArenaHookEvents<TEvents extends MinigameEvents> = {
  [THook in keyof TEvents]: TEvents[THook] extends Observable<infer TEvent> ? TEvent : never
}
export type ArenaHooks<TEvents extends MinigameEvents> = {
  [THook in keyof ArenaHookEvents<TEvents>]?: HookHandler<ArenaHookEvents<TEvents>[THook]>[]
}
