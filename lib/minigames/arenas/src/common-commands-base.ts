import { classFactoryProvider, randomInt } from '@ts-mc/common'
import { MinigameEvents } from '@ts-mc/minigames'
import { area, Area, Block, Coordinates, Effect, loc } from '@ts-mc/core/types'
import { CommandRequest, parallel, series } from '@ts-mc/core/command'
import { block, clear, clearEffect, forceLoadAdd, giveEffect, teleport, wait } from '@ts-mc/core/cmd'

import { Arena } from './arena'
import { CommonCommands } from './common-commands'
import { ArenaMinigameEvents } from './arena-minigame-events'

export class CommonCommandsBase implements CommonCommands {

  public static provide = classFactoryProvider(CommonCommands)

  public readonly center: Coordinates = loc(0, 100, 0)
  public readonly spawnOffsetFromFloor: Coordinates = loc(0, 1, 0)
  public readonly spawnBlacklistOffset: Area = area(
    this.spawnOffsetFromFloor.modify.up(100),
    this.spawnOffsetFromFloor.modify.down(100),
  )

  public readonly holdingSize: number = 50
  public readonly holdingCenter: Coordinates =
    this.center
      .modify.up(120)
      .modify.west(this.holdingSize * 4)
      .modify.north(this.holdingSize * 4)
  public readonly holdingArea: Area = area(
    this.holdingCenter.modify.west(this.holdingSize).modify.north(this.holdingSize),
    this.holdingCenter.modify.east(this.holdingSize).modify.south(this.holdingSize),
  )

  constructor(
    protected events: ArenaMinigameEvents,
  ) {}

  public movePlayersToHolding(): CommandRequest {
    return this.teleportPlayersToRandomWithin([this.holdingArea])
  }

  public movePlayersToArena(arena: Arena<MinigameEvents>): CommandRequest {
    console.log('movePlayersToArena', this.events.players)
    return parallel(
      'command.movePlayersToArena',
      ...this.events.players.map(player => this.teleportPlayer(player.name, arena.getRandomSpawn(), this.center)),
      giveEffect('@a', Effect.instantHealth, 10),
      giveEffect('@a', Effect.saturation, 10),
    )
  }

  public initHoldingArea(): CommandRequest {
    return series(
      'common.initHoldingArea',
      forceLoadAdd(this.holdingArea),
      parallel(
        'initHoldArea blocks and clear',
        clear('@a'),
        clearEffect('@a'),
        block(Block.whiteWool).fill(this.holdingArea),
      ),
      wait(1500),
      this.movePlayersToHolding(),
      wait(2500),
    )
  }

  public removeHoldingArea(): CommandRequest {
    return block(Block.air).fill(this.holdingArea)
  }

  public teleportPlayersToRandomWithin(areas: Area[], facing?: Coordinates | string): CommandRequest {
    return parallel('teleportPlayersToRandomWithin', ...this.events.players.map(player => {
      const spawn = this.getRandomLocation(areas)
      return this.teleportPlayer(player.name, spawn, facing)
    }))
  }

  public teleportPlayer(target: string, loc: Coordinates, facing?: Coordinates | string): CommandRequest {
    return teleport(target, loc.modify.offset(this.spawnOffsetFromFloor), facing)
  }

  public getRandomLocation(areas: Area[], blacklist: Area[] = []): Coordinates {
    const getCandidate = () => {
      const targetArea = areas[randomInt(0, areas.length - 1)]
      return loc(
        randomInt(targetArea.start.x, targetArea.end.x),
        randomInt(targetArea.start.y, targetArea.end.y),
        randomInt(targetArea.start.z, targetArea.end.z),
      )
    }

    let candidate = getCandidate()

    const isValidCandidate = () => {
      if (!candidate) {
        return false
      }
      return !blacklist.some(blacklisted => blacklisted.contains(candidate))
    }

    while (!isValidCandidate()) {
      candidate = getCandidate()
    }
    return candidate
  }

}
