import { Constructor } from '@dandi/common'
import { ModuleBuilder, Registerable } from '@dandi/core'

import { MinigameEvents } from './minigame-events'

export abstract class MinigameModuleBuilder<TBuilder extends MinigameModuleBuilder<TBuilder>> extends ModuleBuilder<TBuilder> {

  protected constructor(
    cloneCtr: Constructor<TBuilder>,
    pkg: string,
    events: Constructor<MinigameEvents>,
    ...entries: Registerable[]
  ) {
    super(
      cloneCtr,
      pkg,
      MinigameEvents.provide(events),
      entries,
    )
  }
}
