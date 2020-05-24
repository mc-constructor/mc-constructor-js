import { ModuleBuilder, Registerable } from '@dandi/core'

import { ArenaManager } from './arena-manager'
import { ArenaManagerEventsProxy } from './arena-manager-events-proxy'
import { ArenasModuleBuilder } from './arenas-module-builder'
import { localToken } from './local-token'

class ArenasSupportModuleBuilder extends ModuleBuilder<ArenasSupportModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ArenasModuleBuilder, localToken.PKG, entries)
  }
}

export const ArenasSupportModule = new ArenasSupportModuleBuilder(
  ArenaManager,
  ArenaManagerEventsProxy,
)
