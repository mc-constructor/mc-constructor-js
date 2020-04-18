import { AttackedByPlayerEvent, AttackedEntityEvent, PlayerEvent } from '@minecraft/core/server'
import { Observable, Subject } from 'rxjs'

import { Arena } from '../../src/arena/arena'
import { ArenaAgeEvent } from '../../src/arena/arena-age-event'
import { CodslapEvents } from '../../src/codslap-events'

export type CodslapEventsFixture = {
  [TProp in keyof CodslapEvents]: TProp extends Observable<infer TEvent> ? Subject<TEvent> : CodslapEvents[TProp]
}

export function codslapEventsFixture(): CodslapEventsFixture {
  return {
    age$: new Subject<ArenaAgeEvent>(),
    arenaStart$: new Subject<Arena>(),
    codslap$: new Subject<PlayerEvent>(),
    codslapMobKill$: new Subject<AttackedByPlayerEvent>(),
    codslapPlayerKill$: new Subject<AttackedByPlayerEvent>(),
    playerDeath$: new Subject<AttackedEntityEvent>(),
    playerRespawn$: new Subject<PlayerEvent>(),

    run$: new Subject<any>(),
  }
}
