import { Inject } from '@dandi/core'
import { text, block } from '@minecraft/core/cmd'
import { randomIntGenerator } from '@minecraft/core/common'
import { Block, loc, Mob } from '@minecraft/core/types'

import { CommonCommands } from '../common'
import { summonBehavior } from '../hooks'

import { Arena, ArenaConstructor } from './arena'
import { ArenaBase, PlatformLayer } from './arena-base'

@Arena()
class BoringArena extends ArenaBase {

  public static readonly title = text('Boring Arena').bold
  public static readonly description = text(`Give me a break, it's just the first level...`)

  public static readonly exitRequirements = [
    Arena.requirements.count('codslap$', 25),
  ]

  public readonly floor: PlatformLayer = {
    radius: 15,
    block: block(Block.grassBlock),
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
    super(common)
  }
}

export const Boring: ArenaConstructor<BoringArena> = BoringArena
