import { stub } from '@dandi/core/testing'
import { Fixture } from '@ts-mc/common/testing'
import { MinigameEvents } from '@ts-mc/minigames'
import { isObservable, merge, NEVER, Observable, timer } from 'rxjs'
import { map, share } from 'rxjs/operators'
import { playerEventsFixture } from '@ts-mc/core/server-events/testing'

export type MinigameEventsFixture<TEvents extends MinigameEvents = MinigameEvents> =
  Fixture<TEvents> & { config(config: Partial<TEvents>): MinigameEventsFixture<TEvents> }

export type MinigameEventsFixtureConfig<TEvents extends MinigameEvents = MinigameEvents> = {
  [TProp in keyof TEvents]?: TEvents[TProp] extends Observable<infer T> ? TEvents[TProp] : never
}

export function minigameEventsFixture<TEvents extends MinigameEvents>(
  config?: MinigameEventsFixtureConfig<TEvents>,
): MinigameEventsFixture<TEvents> {
  const minigameAge$ = timer(0, 1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )
  const fixture = Object.assign(playerEventsFixture(), {
    minigameAge$,
    playerDeath$: NEVER,
    playerRespawn$: NEVER,
    playerReady$: NEVER,

    timedPlayerReadyEvent: stub(),
    waitForPlayerReady: stub(),

    config: function configFixture(
      this: MinigameEventsFixture<TEvents>,
      config: MinigameEventsFixtureConfig<TEvents>,
    ): MinigameEventsFixture<TEvents> {
      return Object.assign(this, config)
    }
  }, config) as any
  return Object.assign(fixture, {
    run$: merge(...Object.values(fixture).filter(isObservable)),
  })
}
