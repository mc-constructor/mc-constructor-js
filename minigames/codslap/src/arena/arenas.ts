import { ModuleBuilder } from '@dandi/core'

import {
  Arena,
  ArenaConfiguration,
  ArenaConstructor,
  ConfiguredArena,
  ConfiguredArenas
} from './arena'
import { BedrockPit } from './bedrock-pit.arena'
import { Boring } from './boring.arena'
import { KingOfTheHill } from './king-of-the-hill.arena'
import { localToken } from './local-token'
import { PrimedAndReady } from './primed-and-ready.arena'
import { ShrinkyDinks } from './shrinky-dinks'

export class ArenasModuleBuilder extends ModuleBuilder<ArenasModuleBuilder> {

  private readonly arenaConfigurations = new Map<ArenaConstructor, ArenaConfiguration>()

  constructor() {
    super(ArenasModuleBuilder, localToken.PKG,
      {
        provide: ConfiguredArenas,
        useFactory: (arenas: Arena[]): ConfiguredArena[] => {
          return arenas.map(arena => ({
            instance: arena,
            config: this.arenaConfigurations.get(arena.constructor as ArenaConstructor),
          }))
        },
        deps: [Arena],
      },
    )
  }

  public arena(arena: ArenaConstructor, config: ArenaConfiguration): this {
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

export const ArenasModule = new ArenasModuleBuilder()
    .arena(Boring, {
      entry: Arena.requirements.none,
      exit: [
        Arena.requirements.minArenaAge(30),
      ],
    })
    .arena(KingOfTheHill, {
      entry: [
        Arena.requirements.count('codslap$', 30),
      ],
      exit: [
        Arena.requirements.minArenaAge(20),
      ],
    })
    .arena(PrimedAndReady, {
      entry: [
        Arena.requirements.count('codslap$', 50),
      ],
      exit: [
        Arena.requirements.minArenaAge(20),
      ],
    })
    .arena(ShrinkyDinks, {
      entry: [
        Arena.requirements.count('codslap$', 70),
      ],
      exit: [
        Arena.requirements.minArenaAge(20),
      ],
    })
    .arena(BedrockPit, {
      entry: [
        Arena.requirements.count('codslap$', 90),
      ],
      exit: [
        Arena.requirements.minArenaAge(20),
      ],
    })

