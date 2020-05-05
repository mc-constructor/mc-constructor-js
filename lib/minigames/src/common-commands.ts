import { giveEffect, rawCmd } from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { area, Coordinates, Effect, loc } from '@ts-mc/core/types'

import { Arena } from './arena'
import { MinigameEvents } from './minigame-events'

export class CommonCommands {

  public readonly center: Coordinates = loc(0, 100, 0)
  public readonly spawnOffsetFromFloor = loc(0, 1, 0)
  public readonly spawnBlacklistOffset = area(
    this.spawnOffsetFromFloor.modify.up(100),
    this.spawnOffsetFromFloor.modify.down(100),
  )

  public readonly holdingCenter = this.center.modify.up(120).modify.west(100)

  constructor(
    protected players: Players,
  ) {}

  public movePlayersToHolding(): CommandRequest {
    return rawCmd(`teleport @a ${this.holdingCenter.modify(this.spawnOffsetFromFloor)}`)
  }

  public movePlayersToArena(arena: Arena<MinigameEvents>): CommandRequest {
    return parallel(
      ...this.players.players.map(player => rawCmd(`teleport ${player.name} ${arena.getRandomSpawn()}`)),
      giveEffect('@a', Effect.instantHealth, 10),
      giveEffect('@a', Effect.saturation, 10),
    )
  }

}
