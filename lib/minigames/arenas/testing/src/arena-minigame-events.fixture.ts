import { minigameEventsFixture, MinigameEventsFixture, MinigameEventsFixtureConfig } from '@ts-mc/minigames/testing'
import { NEVER } from 'rxjs'
import { ArenaMinigameEvents } from '@ts-mc/minigames/arenas'
import { stub } from '@dandi/core/testing'
import { map, scan, share, switchMap } from 'rxjs/operators'

export type ArenaMinigameEventsFixture<TEvents extends ArenaMinigameEvents = ArenaMinigameEvents> = MinigameEventsFixture<TEvents>

export function arenaMinigameEventsFixture<TEvents extends ArenaMinigameEvents = ArenaMinigameEvents>(
  config?: MinigameEventsFixtureConfig<TEvents>,
): ArenaMinigameEventsFixture<TEvents> {
  const fixture = minigameEventsFixture<TEvents>(Object.assign({
    arenaAvailable$: NEVER,
    arenaInit$: NEVER,
    arenaStart$: NEVER,
  }, config))

  return Object.assign(fixture, {
    getArenaAge$: stub().returns(fixture.minigameAge$.pipe(
      map(event => Object.assign({ arenaAge: 0 }, event)),
      scan((result, event) => Object.assign({}, event, {
        arenaAge: result.arenaAge + 1,
      })),
      share(),
    )),
    arenaAge$: fixture.arenaInit$.pipe(
      switchMap(arena => fixture.getArenaAge$(arena.instance)),
      share(),
    ),
  })
}
