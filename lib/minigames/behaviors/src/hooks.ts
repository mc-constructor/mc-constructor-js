import { MinigameEvents } from '@ts-mc/minigames'
import { Observable } from 'rxjs'

import { HookHandler } from './hook-handler'

export type HookSource<TEvents extends MinigameEvents> = {
  [THook in keyof TEvents]: TEvents[THook] extends Observable<infer TEvent> ? Observable<TEvent> : never
}

export type HookEvents<TEvents extends MinigameEvents> = {
  [THook in keyof HookSource<TEvents>]: HookSource<TEvents>[THook] extends Observable<infer TEvent> ? TEvent : never
}
export type Hooks<TEvents extends MinigameEvents> = {
  [THook in keyof HookEvents<TEvents>]?: HookHandler<TEvents>[]
}
