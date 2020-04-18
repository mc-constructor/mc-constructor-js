import { Disposable } from '@dandi/common'
import { Inject, Injectable, RestrictScope } from '@dandi/core'
import { SubscriptionTracker } from '@minecraft/core/common'
import { interval, Observable } from 'rxjs'
import { map, share } from 'rxjs/operators'

import { GameScope } from './game-scope'
import { MinigameAgeEvent } from './minigame-age-event'

@Injectable(RestrictScope(GameScope))
export class MinigameEvents implements Disposable {

  public readonly age$: Observable<MinigameAgeEvent> = interval(1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )

  constructor(
    @Inject(SubscriptionTracker) private subs: SubscriptionTracker,
  ) {
    this.subs.track(this, this.age$.subscribe())
  }

  public dispose(reason: string): void {
    this.subs.release(this)
  }

}
