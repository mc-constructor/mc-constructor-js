import { Inject } from '@dandi/core'
import { block, text } from '@ts-mc/core/cmd'
import { Block } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'
import { ArenaBase, CommonCommands, PlatformLayer, Arena, ArenaConstructor } from '@ts-mc/minigames/arenas'
import { Hooks } from '@ts-mc/minigames/behaviors'

export interface TestArenaProperties<TEvents extends MinigameEvents = MinigameEvents> {
  layers: PlatformLayer[]
  hooks: Hooks<TEvents>
}

export function testArena<TEvents extends MinigameEvents>(
  title: string,
  config?: Partial<TestArenaProperties<TEvents>>,
): ArenaConstructor<TEvents> {

  @Arena()
  class TestArena extends ArenaBase<TEvents> {

    public static readonly title = text(title)
    public static readonly description = text('A test arena')

    public readonly layers: PlatformLayer[] = config?.layers || [
      {
        block: block(Block.grassBlock),
        radius: 5,
        depth: 2,
      }
    ]

    public readonly hooks = config?.hooks

    constructor(@Inject(CommonCommands) common: CommonCommands) {
      super(common)
    }
  }

  return TestArena
}
