import { Inject } from '@dandi/core'
import { text } from '@minecraft/core/cmd/src/text'
import { randomIntGenerator } from '@minecraft/core/common'
import { Block, loc, Mob } from '@minecraft/core/types'
import { take } from 'rxjs/operators'

import { summonBehavior } from '../hooks/spawn-entity'
import { CommonCommands } from '../common'

import { Arena, ArenaConstructor, ArenaHooks } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

@Arena()
class BedrockPitArena extends PlatformArena {

  public static readonly title = text('Bedrock Pit').bold
  public static readonly description = text('Mind the gap...')
  public static readonly entryRequirements = [
    // event$ => event$.codslapPlayerKill$.pipe(take(50)),
    event$ => event$.codslap$.pipe(take(10)),
  ]
  public static readonly exitRequirements = [
    // event$ => event$.codslapPlayerKill$.pipe(take(100)),
    // event$ => event$.codslap$.pipe(take(500)),
    Arena.requirements.minAge(5),
  ]
  // public static readonly entryRequirements = [
  //   event$ => event$.codslapPlayerKill$.pipe(take(50)),
  //   event$ => event$.codslap$.pipe(take(250)),
  // ]
  // public static readonly exitRequirements = [
  //   event$ => event$.codslapPlayerKill$.pipe(take(100)),
  //   event$ => event$.codslap$.pipe(take(500)),
  // ]

  public readonly radius: number = 11
  public readonly gapRadius: number = 3
  public readonly centerOffset = loc(0, 25, 0)

  public readonly layers: PlatformLayer[] = [

    // outer lip
    {
      block: Block.bedrock,
      radius: this.radius + 1,
      depth: 2,
      centerOffset: this.centerOffset,
    },

    // inner space
    {
      block: Block.air,
      radius: this.radius,
      depth: 1,
      centerOffset: this.centerOffset.modify.up(1),
      ignoreForSpawn: true,
    },

    // inner lip
    {
      block: Block.bedrock,
      radius: this.gapRadius + 1,
      depth: 2,
      centerOffset: this.centerOffset,
      ignoreForSpawn: true,
    },

    // inner void
    {
      block: Block.air,
      radius: this.gapRadius,
      depth: 2,
      centerOffset: this.centerOffset,
    }
  ]

  public readonly hooks: ArenaHooks = {
    playerRespawn$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
      summonBehavior(Mob.creeper, randomIntGenerator(0, 6)),
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
