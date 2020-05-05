import { ModuleBuilder, Registerable } from '@dandi/core'

import { CodslapArenasModule } from './arena'
import { CodslapMinigame } from './codslap'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CodslapCommonCommands } from './codslap-common-commands'
import { CodslapInitCommand } from './init'
import { localToken } from './local-token'

export class CodslapModuleBuilder extends ModuleBuilder<CodslapModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CodslapModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CodslapModule = new CodslapModuleBuilder(
  CodslapArenasModule,
  CodslapEvents,
  CodslapInitCommand,
  CodslapMinigame,
  CodslapObjectives,
  CodslapCommonCommands,
)
