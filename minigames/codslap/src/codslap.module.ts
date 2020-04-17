import { ModuleBuilder, Registerable } from '@dandi/core'
import { BedrockPitArena } from './arena/bedrock-pit.arena'

import { BoringArena } from './arena/boring.arena'

import { ArenaManager } from './arena-manager'
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
  BedrockPitArena,
  BoringArena,

  ArenaManager,
  CodslapEvents,
  CodslapInitCommand,
  CodslapMinigame,
  CodslapObjectives,
  CommonCommands,
)
