import { Inject } from '@dandi/core'
import { text, block } from '@ts-mc/core/cmd'
import { Block, loc, Mob } from '@ts-mc/core/types'
import { generateRandomInt } from '@ts-mc/common'
import { Arena, ArenaBase, ArenaConstructor, PlatformLayer, summonBehavior } from '@ts-mc/minigames/arenas'

import { CodslapEvents } from '../codslap-events'
import { CodslapCommonCommands } from '../codslap-common-commands'

@Arena()
class BoringArena extends ArenaBase<CodslapEvents> {

  public static readonly title = text('Boring Arena').bold
  public static readonly description = text(`Give me a break, it's just the first level...`)

  public readonly floor: PlatformLayer = {
    radius: 15,
    block: block(Block.grassBlock),
    centerOffset: loc(0, 25, 0),
    depth: 1,
  }
  public readonly layers: PlatformLayer[] = [this.floor]

  public readonly hooks = {
    arenaStart$: [
      summonBehavior(Mob.cow, { base: 10, playerBonus: generateRandomInt(1, 3), playerMultiplier: 1 }),
    ],
    playerRespawn$: [
      summonBehavior(Mob.cow, { base: 10, playerBonus: generateRandomInt(1, 3), playerMultiplier: 1 }),
    ],
  }

  constructor(
    @Inject(CodslapCommonCommands) private common: CodslapCommonCommands,
  ) {
    super(common)
  }
}

export const Boring: ArenaConstructor<CodslapEvents, BoringArena> = BoringArena
