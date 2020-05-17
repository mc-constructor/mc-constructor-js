import { ArenaBase, CommonCommands, PlatformLayer } from '@ts-mc/minigames/arenas'
import { MinigameEvents } from '@ts-mc/minigames'
import { block } from '@ts-mc/core/cmd'
import { Block } from '@ts-mc/core/types'

export class TestArena extends ArenaBase<MinigameEvents> {
  public readonly layers: PlatformLayer[] = [
    {
      block: block(Block.grassBlock),
      radius: 5,
      depth: 2,
    }
  ]

  constructor(common: CommonCommands) {
    super(common)
  }
}
