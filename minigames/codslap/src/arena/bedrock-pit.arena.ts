import { Inject, Injectable } from '@dandi/core'
import { randomIntGenerator } from '@minecraft/core/common'
import { Block, loc } from '@minecraft/core/types'
import { Mob } from '@minecraft/core/types/src/mob'
import { Observable } from 'rxjs'

import { Behavior } from '../behaviors/behavior'
import { summonBehavior } from '../behaviors/spawn-entity'
import { CommonCommands } from '../common'

import { PlatformArena, PlatformLayer } from './platform-arena'

@Injectable()
export class BedrockPitArena extends PlatformArena {

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

  public readonly playerRespawnBehaviors: Behavior[] = [
    summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    summonBehavior(Mob.creeper, randomIntGenerator(0, 6)),
  ]

  constructor(
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super(common.center)
  }

  public run(): Observable<any> {
    return new Observable<any>()
  }

}
