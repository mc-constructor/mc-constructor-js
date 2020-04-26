import { Inject, Injectable } from '@dandi/core'
import { clear, rawCmd } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { Players } from '@minecraft/core/players'
import { Coordinates, Item, loc } from '@minecraft/core/types'

import { Arena } from './arena'
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

@Injectable()
export class CommonCommands {

  public readonly arenaSize = 35
  public readonly center: Coordinates = loc(0, 100, 0)
  public readonly baseStart = this.center.modify.west(this.arenaSize).modify.north(this.arenaSize)
  public readonly baseEnd = this.center.modify.east(this.arenaSize).modify.south(this.arenaSize)

  public readonly holdingCenter = this.center.modify.up(120).modify.west(100)

  constructor(
    @Inject(CodslapObjectives) private objectives: CodslapObjectives,
    @Inject(Players) private players$: Players,
  ) {}

  public equip(target: string, weapon?: Item): Command {
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

  public resetPlayer(target: string): Command {
    return this.equip(target)
  }

  public movePlayersToHolding(): Command {
    return rawCmd(`teleport @a ${this.holdingCenter.modify.up(2)}`)
  }

  public movePlayersToArena(arena: Arena): Command {
    return parallel(...this.players$.players.map(player => rawCmd(`teleport ${player.name} ${arena.getRandomSpawn()}`)))
  }

  // public getRandomSpawn(): Coordinates {
  //   return this.spawn
  //     .modify(0, this.getRandomPlatformAxisValue())
  //     .modify(2, this.getRandomPlatformAxisValue())
  // }
  //
  // public getRandomPlatformAxisValue(): number {
  //   const spawnSide = Math.random() - 0.5 > 0 ? -1 : 1
  //   return randomInt(this.platformHoleSize + 2, this.spawnRange) * spawnSide
  // }

}
