import { Injectable, RestrictScope } from '@dandi/core'
import { interval, Observable } from 'rxjs'
import { map, share } from 'rxjs/operators'

import { GameScope } from './game-scope'
import { MinigameAgeEvent } from './minigame-age-event'

@Injectable(RestrictScope(GameScope))
export class MinigameEvents {

  public readonly age$: Observable<MinigameAgeEvent> = interval(1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )

}
