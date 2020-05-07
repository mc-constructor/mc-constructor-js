import { ModuleBuilder } from '@dandi/core'
import { MinigameEvents } from '@ts-mc/minigames'

import { Arena, ArenaConfiguration, ArenaConstructor, ConfiguredArena, ConfiguredArenas } from './arena'

export class ArenasModuleBuilder<TEvents extends MinigameEvents> extends ModuleBuilder<ArenasModuleBuilder<TEvents>> {

  private readonly arenaConfigurations = new Map<ArenaConstructor<TEvents>, ArenaConfiguration<TEvents>>()

  constructor(pkg: string) {
    super(ArenasModuleBuilder, pkg,
      {
        provide: ConfiguredArenas,
        useFactory: (arenas: Arena<TEvents>[]): ConfiguredArena<TEvents>[] => {
          return arenas.map(arena => ({
            instance: arena,
            config: this.arenaConfigurations.get(arena.constructor as ArenaConstructor<TEvents>),
          }))
        },
        deps: [Arena],
      },
    )
  }

  public arena(arena: ArenaConstructor<TEvents>, config: ArenaConfiguration<TEvents>): this {
    // adding new items creates a clone of the original instance - it will include any previously registered providers,
    // and add the new provider, but it will not clone the "arenaConfigurations" map
    const cloned = this.add(arena)

    for (const [key, value] of this.arenaConfigurations) {
      // add any existing configuration entries
      cloned.arenaConfigurations.set(key, value)
    }

    // add the configuration to the *new* module builder instance
    cloned.arenaConfigurations.set(arena, config)
    return cloned
  }

}
