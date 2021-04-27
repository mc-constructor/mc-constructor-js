import { classFactoryProvider, randomInt } from '@ts-mc/common'
import { MinigameEvents } from '@ts-mc/minigames'
import { area, Area, Block, Coordinates, Effect, loc, Player } from '@ts-mc/core/types'
import { CommandRequest, parallel, series } from '@ts-mc/core/command'
import { block, clear, clearEffect, forceLoadAdd, giveEffect, teleport, tellraw } from '@ts-mc/core/cmd'

import { Arena } from './arena'
import { CommonCommands } from './common-commands'

// IMPORTANT: do not add dependencies on MinigameEvents / PlayerEvents - it will cause a circular dependency
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

  public movePlayersToHolding(players: Player[]): CommandRequest {
    return parallel(
      'movePlayersToHolding',
      clear('@a'),
      clearEffect('@a'),
      tellraw('@a', 'Off to holding you go...'),
      this.teleportPlayersToRandomWithin(players, [this.holdingArea])
    )
  }

  public movePlayersToArena(players: Player[], arena: Arena<MinigameEvents>): CommandRequest {
    console.log('movePlayersToArena', players)
    return parallel(
      'command.movePlayersToArena',
      tellraw('@a', 'In to the fray...'),
      ...players.map(player => this.teleportPlayer(player.name, arena.getRandomSpawn(), this.center)),
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
        block(Block.whiteWool).fill(this.holdingArea),
      ),
    )
  }

  public removeHoldingArea(): CommandRequest {
    return block(Block.air).fill(this.holdingArea)
  }

  public teleportPlayersToRandomWithin(players: Player[], areas: Area[], facing?: Coordinates | string): CommandRequest {
    return parallel('teleportPlayersToRandomWithin', ...players.map(player => {
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
