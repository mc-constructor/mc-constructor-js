import { AttackedByPlayerEvent, EntityEvent, Player, PlayerEvent } from '@minecraft/core/server'
import { stub } from '@dandi/core/testing'
import { MinigameAgeEvent } from '@minecraft/minigames'
import { Observable, Subject } from 'rxjs'

import { ArenaAgeEvent, ConfiguredArena } from '../../src/arena'
import { CodslapEvents } from '../../src/codslap-events'

export type CodslapEventsFixture = {
  [TProp in keyof CodslapEvents]: TProp extends Observable<infer TEvent> ? Subject<TEvent> : CodslapEvents[TProp]
}

export function codslapEventsFixture(): CodslapEventsFixture {
  return {
    age$: new Subject<ArenaAgeEvent>(),
    arenaAvailable$: new Subject<ConfiguredArena>(),
    arenaStart$: new Subject<ConfiguredArena>(),
    codslap$: new Subject<PlayerEvent>(),
    codslapMobKill$: new Subject<AttackedByPlayerEvent>(),
    codslapPlayerKill$: new Subject<AttackedByPlayerEvent>(),
    minigameAge$: new Subject<MinigameAgeEvent>(),
    playerDeath$: new Subject<EntityEvent>(),
    playerRespawn$: new Subject<PlayerEvent>(),
    playerReady$: new Subject<Player>(),

    run$: new Subject<any>(),

    timedPlayerReadyEvent: stub(),
    waitForPlayerReady: stub(),
  }
}
