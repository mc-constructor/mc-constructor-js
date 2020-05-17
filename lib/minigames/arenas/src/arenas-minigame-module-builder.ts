import { Constructor } from '@dandi/common'
import { Registerable } from '@dandi/core'
import { MinigameEvents, MinigameModuleBuilder } from '@ts-mc/minigames'

import { CommonCommandsConstructor } from './common-commands'

export abstract class ArenasMinigameModuleBuilder<TBuilder extends ArenasMinigameModuleBuilder<TBuilder>> extends MinigameModuleBuilder<TBuilder> {

  protected constructor(
    cloneCtr: Constructor<TBuilder>,
    pkg: string,
    events: Constructor<MinigameEvents>,
    commonCommands: CommonCommandsConstructor<any>,
    ...entries: Registerable[]
  ) {
    super(
      cloneCtr,
      pkg,
      events,
      commonCommands.provide(),
      entries,
    )
  }
}
