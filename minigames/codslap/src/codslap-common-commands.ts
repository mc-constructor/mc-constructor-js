import { Inject } from '@dandi/core'
import { clear, rawCmd } from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { area, Coordinates, Item, loc } from '@ts-mc/core/types'
import { CommonCommands } from '@ts-mc/minigames/arenas'

import { CodslapObjectives } from './codslap-objectives'

export type Codslapper = Item.codslapper | Item.diamondCodslapper | Item.goldCodslapper | Item.ironCodslapper | Item.stoneCodslapper | Item.woodenCodslapper

const LEVELED_WEAPONS: [Codslapper, Codslapper, Codslapper, Codslapper, Codslapper, Codslapper] = [
  Item.codslapper,
  Item.diamondCodslapper,
  Item.goldCodslapper,
  Item.ironCodslapper,
  Item.stoneCodslapper,
  Item.woodenCodslapper,
]

const LEVELS: [number, number, number, number, number, number] = [500, 234, 104, 42, 15, 0]

export function isCodslapper(item: any): item is Codslapper {
  return LEVELED_WEAPONS.includes(item)
}

export class CodslapCommonCommands extends CommonCommands {

  public readonly arenaSize = 35
  public readonly center: Coordinates = loc(0, 100, 0)
  public readonly baseStart = this.center.modify.west(this.arenaSize).modify.north(this.arenaSize)
  public readonly baseEnd = this.center.modify.east(this.arenaSize).modify.south(this.arenaSize)
  public readonly spawnOffsetFromFloor = loc(0, 1, 0)
  public readonly spawnBlacklistOffset = area(
    this.spawnOffsetFromFloor.modify.up(100),
    this.spawnOffsetFromFloor.modify.down(100),
  )

  public readonly holdingCenter = this.center.modify.up(120).modify.west(100)

  constructor(
    @Inject(CodslapObjectives) private objectives: CodslapObjectives,
    @Inject(Players) players: Players,
  ) {
    super(players)
  }

  public equip(target: string, weapon?: Item): CommandRequest {
    return parallel(
      clear(target),
      rawCmd(`replaceitem entity ${target} weapon.mainhand ${weapon || this.getPlayerWeapon(target)[0]}`),
    )
  }

  public getPlayerWeapon(target: string): [Item, number] {
    const score = this.objectives.codslap.getScore(target)
    const weapon = LEVELED_WEAPONS.find((item, level) => score >= LEVELS[level])
    const nextLevel = LEVELED_WEAPONS.indexOf(weapon) - 1
    if (nextLevel < 0) {
      return [weapon, NaN]
    }
    return [weapon, LEVELS[nextLevel] - score]
  }

  public resetPlayer(target: string): CommandRequest {
    return this.equip(target)
  }

}