import { ModuleBuilder, Registerable } from '@dandi/core'

import { CodslapMiniGame } from './codslap'
import { CommonCommands } from './common'
import { CodslapInitCommand } from './init'
import { localToken } from './local-token'

export class CodslapModuleBuilder extends ModuleBuilder<CodslapModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CodslapModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CodslapModule = new CodslapModuleBuilder(
  CodslapMiniGame,
  CodslapInitCommand,
  CommonCommands,
)
