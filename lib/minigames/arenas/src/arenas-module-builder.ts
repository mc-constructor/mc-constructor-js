import { inspect } from 'util'

import { ModuleBuilder } from '@dandi/core'
import { TextComponent } from '@ts-mc/core/cmd'

import {
  Arena,
  ArenaConfiguration,
  ArenaConstructor,
  arenaDescriptor,
  ConfiguredArena,
  ConfiguredArenas
} from './arena'
import { ArenaMinigameEvents } from './arena-minigame-events'

class ModuleConfiguredArena<TEvents extends ArenaMinigameEvents> implements ConfiguredArena<TEvents> {

  public readonly title: TextComponent
  public readonly description: TextComponent

  private _debug: string
  protected get debug(): string {
    if (!this._debug) {
      this._debug = this.title[inspect.custom]()
    }
    return this._debug
  }

  constructor(
    public readonly instance: Arena<TEvents>,
    public readonly config: ArenaConfiguration<TEvents>,
  ) {
    Object.assign(this, arenaDescriptor(instance))
  }

  public get [Symbol.toStringTag](): string {
    return `[${this.constructor.name} ${this.debug}]`
  }
}

export class ArenasModuleBuilder<TEvents extends ArenaMinigameEvents> extends ModuleBuilder<ArenasModuleBuilder<TEvents>> {

  private readonly arenaConfigurations = new Map<ArenaConstructor<TEvents>, ArenaConfiguration<TEvents>>()

  constructor(pkg: string) {
    super(ArenasModuleBuilder, pkg,
      {
        provide: ConfiguredArenas,
        useFactory: (arenas: Arena<TEvents>[]): ConfiguredArena<TEvents>[] =>
          arenas.map(arena => new ModuleConfiguredArena(
            arena,
            this.arenaConfigurations.get(arena.constructor as ArenaConstructor<TEvents>),
          )),
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
