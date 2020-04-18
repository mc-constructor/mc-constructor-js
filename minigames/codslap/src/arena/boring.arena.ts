import { Inject } from '@dandi/core'
import { text } from '@minecraft/core/cmd'
import { randomIntGenerator } from '@minecraft/core/common'
import { Block, loc, Mob } from '@minecraft/core/types'

import { CommonCommands } from '../common'
import { summonBehavior } from '../hooks'

import { Arena, ArenaConstructor } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

@Arena()
class BoringArena extends PlatformArena {

  public static readonly title = text('Boring Arena').bold
  public static readonly description = text(`Give me a break, it's just the first level...`)
  public static readonly entryRequirements = Arena.requirements.none
  public static readonly exitRequirements = [
    // Arena.requirements.minAge(300), // 5 min
    Arena.requirements.minAge(10),
  ]

  public readonly floor: PlatformLayer = {
    radius: 15,
    block: Block.grassBlock,
    centerOffset: loc(0, 25, 0),
    depth: 1,
  }
  public readonly layers: PlatformLayer[] = [this.floor]

  public readonly hooks = {
    arenaStart$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
    playerRespawn$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
  }

  constructor(
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super(common.center)
  }
}

export const Boring: ArenaConstructor<BoringArena> = BoringArena
