import { Registerable } from '@dandi/core'
import { ArenasMinigameModuleBuilder, ArenasSupportModule } from '@ts-mc/minigames/arenas'
import { MinigameEntitiesModule } from '@ts-mc/minigames/entities'

import { CodslapArenasModule } from './arena'
import { CodslapMinigame } from './codslap'
import { CodslapCommonCommands } from './codslap-common-commands'
import { CodslapEvents } from './codslap-events'
import { CodslapObjectives } from './codslap-objectives'
import { CodslapInit } from './init'
import { localToken } from './local-token'

export class CodslapModuleBuilder extends ArenasMinigameModuleBuilder<CodslapModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(CodslapModuleBuilder, localToken.PKG, CodslapEvents, CodslapCommonCommands, ...entries)
  }
}

export const CodslapModule = new CodslapModuleBuilder(
  ArenasSupportModule,
  CodslapArenasModule,
  CodslapInit,
  CodslapMinigame,
  CodslapObjectives,
  MinigameEntitiesModule,
)
