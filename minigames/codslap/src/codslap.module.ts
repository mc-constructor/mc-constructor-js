import { ModuleBuilder, Registerable } from '@dandi/core'

import { CodslapMinigame } from './codslap'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { CodslapInitCommand } from './init'
import { localToken } from './local-token'

export class CodslapModuleBuilder extends ModuleBuilder<CodslapModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CodslapModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CodslapModule = new CodslapModuleBuilder(
  CodslapEvents,
  CodslapInitCommand,
  CodslapMinigame,
  CodslapObjectives,
  CommonCommands,
)
