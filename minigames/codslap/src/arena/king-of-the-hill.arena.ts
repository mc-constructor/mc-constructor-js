import { Inject } from '@dandi/core'
import { randomIntGenerator, range } from '@ts-mc/common'
import { block, text } from '@ts-mc/core/cmd'
import { Block, Direction, loc, Mob } from '@ts-mc/core/types'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer, summonBehavior } from '@ts-mc/minigames/arenas'

import { CodslapCommonCommands } from '../codslap-common-commands'
import { CodslapEvents } from '../codslap-events'

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
class KingOfTheHillArena extends ArenaBase<CodslapEvents> {

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
    @Inject(CodslapCommonCommands) common: CodslapCommonCommands,
  ) {
    super(common)
  }

}

export const KingOfTheHill: ArenaConstructor<CodslapEvents, KingOfTheHillArena> = KingOfTheHillArena
