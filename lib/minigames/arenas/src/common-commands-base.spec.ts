import { repeat, stubLoggerFactory } from '@ts-mc/common/testing'
import { playersFixture } from '@ts-mc/core/players/testing'
import { area, loc } from '@ts-mc/core/types'
import { CommonCommandsBase } from '@ts-mc/minigames/arenas'

import { expect } from 'chai'

describe('CommonCommandsBase', () => {

  stubLoggerFactory()

  let common: CommonCommandsBase

  beforeEach(() => {
    common = new CommonCommandsBase(playersFixture() as any)
  })
  afterEach(() => {
    common = undefined
  })

  describe('getRandomLocation', () => {

    it('returns a point inside the specified area', () => {
      repeat(10000, () => {
        const sourceArea = area(loc(0, 0, 0), loc(100, 100, 100))
        const result = common.getRandomLocation([sourceArea])
        expect(result).to.be.within(sourceArea)
      })
    })

    it('does not return spawn points that fall within blacklisted areas', () => {
      repeat(10000, () => {
        const sourceArea = area(loc(0, 0, 0), loc(10, 10, 10))
        const blacklistArea = area(loc(1, 1, 1), loc(9, 9, 9))
        const result = common.getRandomLocation([sourceArea], [blacklistArea])

        expect(result, 'within area').to.be.within(sourceArea)
        expect(result, 'not within blacklisted area').not.to.be.within(blacklistArea)
      })

    })

  })

})
