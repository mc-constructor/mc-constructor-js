import { stub } from '@dandi/core/testing'
import { interval, NEVER, Observable } from 'rxjs'
import { map, scan, share } from 'rxjs/operators'
import { SinonStub } from 'sinon'

import { CodslapEvents } from '../../src/codslap-events'

type AnyFn = (...args: any[]) => any

export type CodslapEventsFixture = {
  [TProp in keyof CodslapEvents]: CodslapEvents[TProp] extends AnyFn ?
    SinonStub<Parameters<CodslapEvents[TProp]>, ReturnType<CodslapEvents[TProp]>> :
    CodslapEvents[TProp]
} & { config(config: Partial<CodslapEvents>): CodslapEventsFixture }

export type CodslapEventsFixtureConfig = {
  [TProp in keyof CodslapEvents]?: CodslapEvents[TProp] extends Observable<infer T> ? CodslapEvents[TProp] : never
}

export function codslapEventsFixture(config?: CodslapEventsFixtureConfig): CodslapEventsFixture {
  const minigameAge$ = interval(1000).pipe(
    map(minigameAge => ({ minigameAge })),
    share(),
  )
  return Object.assign({
    arenaAvailable$: NEVER,
    arenaStart$: NEVER,
    codslap$: NEVER,
    codslapMobKill$: NEVER,
    codslapPlayerKill$: NEVER,
    minigameAge$,
    playerDeath$: NEVER,
    playerRespawn$: NEVER,
    playerReady$: NEVER,

    run$: NEVER,

    timedPlayerReadyEvent: stub(),
    waitForPlayerReady: stub(),

    config: function (config: CodslapEventsFixtureConfig) {
      return Object.assign(this, config)
    }
  }, config, {
    age$: minigameAge$.pipe(
      map(event => Object.assign({ arenaAge: 0 }, event)),
      scan((result, event) => Object.assign({}, event, {
        arenaAge: result.arenaAge + 1,
      })),
      share(),
    )
  }) as any
}
