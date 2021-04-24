import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { SummonBehaviorManager } from './summon-behavior-manager'
import { SummonedEntityManager } from './summoned-entity-manager'

class MinigameEntitiesModuleBuilder extends ModuleBuilder<MinigameEntitiesModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(MinigameEntitiesModuleBuilder, localToken.PKG, ...entries)
  }
}

export const MinigameEntitiesModule = new MinigameEntitiesModuleBuilder(
  SummonedEntityManager,
  SummonBehaviorManager,
)
