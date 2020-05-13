import { MinigameEvents } from '@ts-mc/minigames'
import { Observable, of } from 'rxjs'
import { filter, take } from 'rxjs/operators'
import { Arena } from './arena'

import { ArenaHookEvents } from './arena-hook'
import { ArenaMinigameEvents } from './arena-minigame-events'
import { ArenaRequirement } from './arena-requirement'

export type NoRequirements = [() => Observable<void>]
export const NoRequirements: NoRequirements = [() => of(undefined)]

export interface ArenaRequirementsStatic<TEvents extends MinigameEvents> {
  none: NoRequirements
  count(hook: keyof TEvents, count: number): ArenaRequirement<TEvents>
  minArenaAge<TEvents extends ArenaMinigameEvents>(age: number): ArenaRequirement<TEvents>
  minGameAge(age: number): ArenaRequirement<TEvents>
}

export function ArenaRequirements<TEvents extends MinigameEvents>(): ArenaRequirementsStatic<TEvents> {
  return {
    none: NoRequirements,
    count: <TEvents extends MinigameEvents>(hook: keyof ArenaHookEvents<TEvents>, count: number): ArenaRequirement<TEvents> =>
      (events: TEvents) => {
        const event$: Observable<any> = events[hook] as any
        return event$.pipe(take(count))
      },
    minArenaAge: <TEvents extends ArenaMinigameEvents>(age: number): ArenaRequirement<TEvents> =>
      (events: TEvents, arena: Arena<TEvents>) =>
        events.getArenaAge$(arena).pipe(
          filter(event => event.arenaAge >= age),
          take(1),
        ),
    minGameAge: <TEvents extends MinigameEvents>(age: number): ArenaRequirement<TEvents> =>
      (events: TEvents) =>
        events.minigameAge$.pipe(
          filter(event => event.minigameAge >= age),
          take(1),
        ),
  }
}
