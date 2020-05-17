import { Fixture } from '@ts-mc/common/testing'
import { CommonCommands } from '@ts-mc/minigames/arenas'
import { loc, area } from '@ts-mc/core/types'
import { stub } from '@dandi/core/testing'

export interface CommonCommandsFixture extends Fixture<CommonCommands> {
}

export type CommonCommandsProperties = {
  [TKey in keyof CommonCommands]: CommonCommands[TKey] extends (...args: any[]) => any ? never : CommonCommands[TKey]
}

export function commonCommandsFixture(config?: Partial<CommonCommandsProperties>): CommonCommandsFixture {
  return Object.assign({

    center: loc(0, 100, 0),
    spawnOffsetFromFloor: loc(0, 1, 0),
    spawnBlacklistOffset: area(loc(0, -100, 0), loc(0, 100, 0)),

    holdingSize: 60,
    holdingCenter: loc(100, 100, 100),
    holdingArea: area(loc(50, 100, 50), loc(150, 100, 150)),

    movePlayersToHolding: stub(),
    movePlayersToArena: stub(),
    initHoldingArea: stub(),
    removeHoldingArea: stub(),
    teleportPlayersToRandomWithin: stub(),
    teleportPlayer: stub(),
    getRandomLocation: stub(),
  }, config)
}
