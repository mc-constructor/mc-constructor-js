import { Inject } from '@dandi/core'
import { block } from '@minecraft/core/cmd'
import { text } from '@minecraft/core/cmd/src/text'
import { randomInt, randomIntGenerator } from '@minecraft/core/common'
import { Block, loc, Mob } from '@minecraft/core/types'

import { summonBehavior } from '../hooks'
import { CommonCommands } from '../common'

import { Arena, ArenaConstructor, ArenaHooks } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

@Arena()
class BedrockPitArena extends PlatformArena {

  public static readonly title = text('Bedrock Pit').bold
  public static readonly description = text('Mind the gap...')

  public static readonly exitRequirements = [
    Arena.requirements.count('codslapPlayerKill$', 100),
  ]

  public readonly radius: number = 11
  public readonly gapRadius: number = 3
  public readonly centerOffset = loc(0, 25, 0)

  public readonly layers: PlatformLayer[] = [

    // outer lip
    {
      block: block(Block.bedrock),
      radius: this.radius + 1,
      depth: 2,
      centerOffset: this.centerOffset,
    },

    // inner space
    {
      block: block(Block.air),
      radius: this.radius,
      depth: 1,
      centerOffset: this.centerOffset.modify.up(1),
      ignoreForSpawn: true,
    },

    // inner lip
    {
      block: block(Block.bedrock),
      radius: this.gapRadius + 1,
      depth: 2,
      centerOffset: this.centerOffset,
      ignoreForSpawn: true,
    },

    // inner void
    {
      block: block(Block.air),
      radius: this.gapRadius,
      depth: 2,
      centerOffset: this.centerOffset,
    }
  ]

  public readonly hooks: ArenaHooks = {
    playerRespawn$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
      summonBehavior(Mob.creeper, randomIntGenerator(0, 6)),
      summonBehavior([Mob.creeper, '{powered:1}'], () => {
        const probs = [0, 0, 0, 0, 1]
        return probs[randomInt(0, probs.length - 1)]
      })
    ],
    arenaStart$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ]
  }

  constructor(
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super(common.center)
  }
}

export const BedrockPit: ArenaConstructor<BedrockPitArena> = BedrockPitArena
