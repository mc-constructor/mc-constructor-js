import { ModuleBuilder, Registerable } from '@dandi/core'

import { ArenasModule } from './arena'
import { ArenaManager } from './arena-manager'
import { CodslapMinigame } from './codslap'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CommonCommands } from './common'
import { EventsAccessorProvider } from './events-accessor-provider'
import { CodslapInitCommand } from './init'
import { localToken } from './local-token'

export class CodslapModuleBuilder extends ModuleBuilder<CodslapModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CodslapModuleBuilder, localToken.PKG, ...entries)
  }
}

export const CodslapModule = new CodslapModuleBuilder(
  ArenasModule,
  ArenaManager,
  CodslapEvents,
  CodslapInitCommand,
  CodslapMinigame,
  CodslapObjectives,
  CommonCommands,
  EventsAccessorProvider,
)
