import { Inject } from '@dandi/core'
import { block, text } from '@minecraft/core/cmd'
import { randomIntGenerator, range } from '@minecraft/core/common'
import { Block, Direction, loc, Mob } from '@minecraft/core/types'
import { CommonCommands } from '../common'
import { summonBehavior } from '../hooks'

import { Arena, ArenaConstructor } from './arena'
import { PlatformArena, PlatformLayer } from './platform-arena'

const STAIRS = [
  Block.acaciaStairs,
  Block.andesiteStairs,
  Block.birchStairs,
  Block.brickStairs,
  Block.cobblestoneStairs,
  Block.darkOakStairs,
  Block.darkPrismarineStairs,
  Block.dioriteStairs,
  Block.endStoneBrickStairs,
  Block.jungleStairs,
  Block.graniteStairs,
  Block.netherBrickStairs,
  Block.spruceStairs,
  Block.smoothSandstoneStairs,
  Block.smoothRedSandstoneStairs,
  Block.polishedGraniteStairs,
]

@Arena()
class KingOfTheHillArena extends PlatformArena {

  public static readonly title = text('King of the Hill').bold
  public static readonly description = text('Mmmmmhm.')

  private readonly stairs = STAIRS.slice(0).sort(() => Math.random() - 0.5)

  public readonly layers: PlatformLayer[] = range(1, 15).reduce((layers, radius) => {
    const centerOffset = loc(0, 40 - radius, 0)
    const faces: [Direction, [number, number], [number, number]][] = [
      // note: step blocks must face the opposite direction of the face
      [Direction.south, [-radius, 0], [-radius, 0]], // north face,
      [Direction.north, [radius, 0], [radius, 0]],  // south face

      // use 1 less radius on east/west so that the corners align correctly
      [Direction.east, [0, -(radius - 1)], [0, -radius]],  // west face
      [Direction.west, [0, radius - 1], [0, radius]],   // east face
    ]
    layers.push(...faces.map(([direction, sideRadius, sideOffset]) => ({
      block: block(this.stairs[radius * 100 % this.stairs.length]).facing(direction),
      radius: sideRadius,
      depth: 1,
      centerOffset: centerOffset.modify(0, sideOffset[1]).modify(2, sideOffset[0]),
    })))
    return layers
  }, [] as PlatformLayer[])

  public readonly hooks = {
    arenaStart$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
    playerRespawn$: [
      summonBehavior(Mob.cow, randomIntGenerator(10, 20)),
    ],
  }

  constructor(
    @Inject(CommonCommands) common: CommonCommands,
  ) {
    super(common.center)
  }

}

export const KingOfTheHill: ArenaConstructor<KingOfTheHillArena> = KingOfTheHillArena
