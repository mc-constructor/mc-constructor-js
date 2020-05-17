import { MinigameEventsFixtureConfig } from '@ts-mc/minigames/testing'
import { ArenaMinigameEventsFixture, arenaMinigameEventsFixture } from '@ts-mc/minigames/arenas/testing'
import { NEVER } from 'rxjs'

import { CodslapEvents } from '../../src/codslap-events'

export type CodslapEventsFixture = ArenaMinigameEventsFixture<CodslapEvents>

export function codslapEventsFixture(config?: MinigameEventsFixtureConfig<CodslapEvents>): CodslapEventsFixture {
  return arenaMinigameEventsFixture<CodslapEvents>(Object.assign({
    codslap$: NEVER,
    codslapMobKill$: NEVER,
    codslapPlayerKill$: NEVER,
  }, config))
}
