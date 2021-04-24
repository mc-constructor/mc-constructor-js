import { Inject } from '@dandi/core'
import { generateRandomInt, generateRandom } from '@ts-mc/common'
import { block, text } from '@ts-mc/core/cmd'
import { Block, Creeper, loc, Mob } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer } from '@ts-mc/minigames/arenas'
import { Hooks } from '@ts-mc/minigames/behaviors'
import { SummonBehaviorManager } from '@ts-mc/minigames/entities'

import { CodslapCommonCommands } from '../codslap-common-commands'
import { CodslapEvents } from '../codslap-events'

@Arena()
class BedrockPitArena extends ArenaBase<CodslapEvents, CodslapCommonCommands> {

  public static readonly title = text('Bedrock Pit').bold
  public static readonly description = text('Mind the gap...')

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

  public readonly hooks: Hooks<CodslapEvents>

  constructor(
    @Inject(CodslapCommonCommands) common: CodslapCommonCommands,
    @Inject(SummonBehaviorManager) protected readonly summon: SummonBehaviorManager,
  ) {
    super(common)

    this.hooks = {
      playerRespawn$: [
        this.summon.createMobBehavior(Mob.creeper, { base: generateRandomInt(1, 3), playerMultiplier: generateRandomInt(1, 2) }),
        this.summon.createMobBehavior([Mob.creeper, { powered: Creeper.powered }], generateRandom([0, 0, 0, 0, 1])),
        this.common.summonCowsOnRespawnBehavior,
      ],
      arenaStart$: [
        this.common.summonCowsOnStartBehavior,
      ],
    }
  }
}

export const BedrockPit: ArenaConstructor<CodslapEvents, BedrockPitArena> = BedrockPitArena
