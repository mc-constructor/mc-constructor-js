import { Inject } from '@dandi/core'
import { randomInt, randomIntGenerator } from '@ts-mc/common'
import { block, text } from '@ts-mc/core/cmd'
import { Block, loc, Mob } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, ArenaHooks, PlatformLayer, summonBehavior } from '@ts-mc/minigames'

import { CodslapCommonCommands } from '../codslap-common-commands'
import { CodslapEvents } from '../codslap-events'
import { Codslap } from '../codslap-static'

@Arena()
class BedrockPitArena extends ArenaBase<CodslapEvents> {

  public static readonly title = text('Bedrock Pit').bold
  public static readonly description = text('Mind the gap...')

  public static readonly exitRequirements = [
    Codslap.requirements.count('codslapPlayerKill$', 100),
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

  public readonly hooks: ArenaHooks<CodslapEvents> = {
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
    @Inject(CodslapCommonCommands) private common: CodslapCommonCommands,
  ) {
    super(common)
  }
}

export const BedrockPit: ArenaConstructor<CodslapEvents, BedrockPitArena> = BedrockPitArena
