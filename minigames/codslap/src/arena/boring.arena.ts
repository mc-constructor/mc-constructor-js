import { Inject } from '@dandi/core'
import { text } from '@minecraft/core/cmd'
import { Block, loc } from '@minecraft/core/types'

import { CommonCommands } from '../common'

import { Arena } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

@Arena()
export class BoringArena extends PlatformArena {

  public static readonly title = text('Boring Arena').bold
  public static readonly description = text(`Give me a break, it's the first level...`)
  public static readonly entryRequirements = Arena.requirements.none
  public static readonly exitRequirements = Arena.requirements.minAge(300) // 5 min

  public readonly floor: PlatformLayer = {
    radius: 15,
    block: Block.grassBlock,
    centerOffset: loc(0, 25, 0),
    depth: 1,
  }
  public readonly layers: PlatformLayer[] = [this.floor]

  constructor(
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super(common.center)
  }
}
