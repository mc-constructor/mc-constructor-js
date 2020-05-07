import { stub } from '@dandi/core/testing'
import { impersonate, stubLoggerFactory, repeat } from '@ts-mc/common/testing'
import { block } from '@ts-mc/core/cmd'
import { area, Block, loc } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'

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
    arena.init()
  })
  afterEach(() => {
    arena = undefined
  })

  describe('getRandomSpawn', () => {

    it('returns a spawn point inside a platform layer', () => {
      repeat(10000, () => {
        impersonate(arena, function(this: TestArena) {
          const [, start, end] = this.getLayerArea(this.layers[0])
          const spawnArea = area(start, end)
          const spawn = this.getRandomSpawn()
          expect(spawn).to.be.within(spawnArea)
        })
      })
    })

    it('does not return spawn points that fall within blacklisted areas', () => {
      impersonate(arena, function(this: TestArena) {
        const [center] = this.getLayerArea(this.layers[0])
        this.blacklistSpawnArea(area(center, center))
        stub(this as any, 'getRandomSpawnCandidate')
          .callThrough()
          .onFirstCall().returns(center)

        expect(this.getRandomSpawn()).not.to.deep.equal(center)
      })
    })

  })

})
