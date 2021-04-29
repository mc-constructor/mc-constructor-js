import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { MinigameEntrypoint } from './minigame-entrypoint'
import { MinigameLoader } from './minigame-loader'
import { MinigameManager } from './minigame-manager'

export class MinigameManagementModuleBuilder extends ModuleBuilder<MinigameManagementModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(MinigameManagementModuleBuilder, localToken.PKG, ...entries)
  }
}

export const MinigameManagementModule = new MinigameManagementModuleBuilder(
  MinigameEntrypoint,
  MinigameLoader,
  MinigameManager,
)
