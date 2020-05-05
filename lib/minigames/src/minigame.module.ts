import { ModuleBuilder, Registerable } from '@dandi/core'

import { ArenaManager } from './arena-manager'
import { CommonCommands } from './common-commands'
import { EventsAccessorProvider } from './events-accessor-provider'
import { localToken } from './local-token'
import { MinigameLoader } from './minigame-loader'
import { MinigameManager } from './minigame-manager'
import { MinigameRunner } from './minigame-runner'

export class MinigameModuleBuilder extends ModuleBuilder<MinigameModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(MinigameModuleBuilder, localToken.PKG, ...entries)
  }
}

export const MinigameModule = new MinigameModuleBuilder(
  ArenaManager,
  CommonCommands,
  EventsAccessorProvider,
  MinigameLoader,
  MinigameManager,
  MinigameRunner,
)
