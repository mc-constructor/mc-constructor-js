import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { Scoreboard } from './scoreboard'

export class ScoreboardModuleBuilder extends ModuleBuilder<ScoreboardModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ScoreboardModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ScoreboardModule = new ScoreboardModuleBuilder(
  Scoreboard,
)
