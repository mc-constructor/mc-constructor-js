import { MinigameEvents } from '@ts-mc/minigames'
import { Observable } from 'rxjs'
import { map, scan, share, tap } from 'rxjs/operators'

import { Arena } from './arena'
import { ArenaAgeEvent } from './arena-age-event'

export class ArenaMinigameEvents extends MinigameEvents {

  private readonly arenaAgeMap = new Map<Arena<this>, Observable<ArenaAgeEvent>>()

  public arenaAge$(arena: Arena<this>): Observable<ArenaAgeEvent> {
    let arenaAge$: Observable<ArenaAgeEvent> = this.arenaAgeMap.get(arena)
    if (!arenaAge$) {
      arenaAge$ = this.minigameAge$.pipe(
        map(event => Object.assign({ arenaAge: 0 }, event)),
        scan((result, event) => Object.assign({}, event, {
          arenaAge: result.arenaAge + 1,
        })),
        tap(event => this.logger.debug('age$', event)),
        share(),
      )
      this.arenaAgeMap.set(arena, arenaAge$)
    }
    return arenaAge$
  }
}
