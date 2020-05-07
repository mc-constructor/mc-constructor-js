import { MinigameEvents } from '@ts-mc/minigames'
import { Observable } from 'rxjs'

import { Arena } from './arena'

export type ArenaRequirement<TEvents extends MinigameEvents, TArena extends Arena<TEvents> = Arena<TEvents>> =
  (events: TEvents, arena: TArena) => Observable<any>
