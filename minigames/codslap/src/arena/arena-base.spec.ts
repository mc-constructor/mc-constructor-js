import { block } from '@minecraft/core/cmd'
import { impersonate, stubLoggerFactory } from '@minecraft/core/common/testing'
import { area, Block, loc } from '@minecraft/core/types'

import { expect } from 'chai'

import { ArenaBase, PlatformLayer } from './arena-base'

describe('ArenaBase', () => {

  stubLoggerFactory()

  class TestArena extends ArenaBase {
    public readonly layers: PlatformLayer[] = [
      {
        block: block(Block.grassBlock),
        radius: 5,
        depth: 2,
      }
    ]

    constructor() {
      super({
        center: loc(0, 100, 0),
        spawnOffsetFromFloor: loc(0, 1, 0),
        spawnBlacklistOffset: area(loc(0, 101, 0), loc(0, -99, 0))
      })
    }
  }

  let arena: TestArena

  beforeEach(() => {
    arena = new TestArena()
  })
  afterEach(() => {
    arena = undefined
  })

  describe('getRandomSpawn', () => {

    it('returns a spawn point inside a platform layer', () => {
      arena.init()

      impersonate(arena, function(this: TestArena) {
        const [, start, end] = this.getLayerArea(this.layers[0])
        const spawnArea = area(start, end)
        const spawn = this.getRandomSpawn()
        expect(spawn).to.be.within(spawnArea)
      })
    })

  })

})
