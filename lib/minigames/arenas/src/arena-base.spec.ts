import { stubLoggerFactory } from '@ts-mc/common/testing'
import { block } from '@ts-mc/core/cmd'
import { area, Block } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'
import { commonCommandsFixture } from '@ts-mc/minigames/arenas/testing'

import { expect } from 'chai'

import { ArenaBase, PlatformLayer } from './arena-base'

describe('ArenaBase', () => {

  stubLoggerFactory()

  class TestArena extends ArenaBase<MinigameEvents> {
    public readonly layers: PlatformLayer[] = [
      {
        block: block(Block.grassBlock),
        radius: 5,
        depth: 2,
      }
    ]

    constructor() {
      super(commonCommandsFixture())
    }
  }

  let arena: TestArena

  beforeEach(() => {
    arena = new TestArena()
    arena.init()
  })
  afterEach(() => {
    arena = undefined
  })

})
