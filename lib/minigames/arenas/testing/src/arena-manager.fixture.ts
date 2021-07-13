import { ArenaManager, ArenaMinigameEvents } from '@ts-mc/minigames/arenas'
import { Fixture } from '@ts-mc/common/testing'
import { NEVER, Observable } from 'rxjs'

export type ArenaManagerFixture<TEvents extends ArenaMinigameEvents = ArenaMinigameEvents> =
  Fixture<ArenaManager<TEvents>> & { config(config: Partial<TEvents>): ArenaManagerFixture<TEvents> }

export type ArenaManagerFixtureConfig<TEvents extends ArenaMinigameEvents = ArenaMinigameEvents> = {
  [TProp in keyof ArenaManager<TEvents>]?: ArenaManager<TEvents>[TProp] extends Observable<infer T> ?
    ArenaManager<TEvents>[TProp] :
    never
}

export function arenaManagerFixture<TEvents extends ArenaMinigameEvents>(
  config?: ArenaManagerFixtureConfig<TEvents>,
): ArenaManagerFixture<TEvents> {
  const arenaAvailable$ = NEVER
  const arenaComplete$ = config?.arenaComplete$ || NEVER
  const arenaInit$ = NEVER
  const arenaStart$ = NEVER
  const pendingArenas$ = NEVER
  const lastArena$ = NEVER
  return Object.assign({
    arenaAvailable$,
    arenaComplete$,
    arenaInit$,
    arenaStart$,
    lastArena$,
    pendingArenas$,
    run$: arenaComplete$,

    config: function configFixture(
      this: ArenaManagerFixture<TEvents>,
      config: ArenaManagerFixtureConfig<TEvents>,
    ): ArenaManagerFixture<TEvents> {
      return Object.assign(this, config)
    }
  } as ArenaManagerFixture<TEvents>, config)
}
