import { Injectable } from '@dandi/core'
import { Command, item, rawCmd, text } from '@minecraft/core/cmd'
import { randomInt } from '@minecraft/core/common'
import { Coordinates, Item, loc } from '@minecraft/core/types'

@Injectable()
export class CommonCommands {

  public readonly arenaSize = 35
  public readonly platformRadius = Math.floor(this.arenaSize / 3)
  public readonly center: Coordinates = loc(0, 100, 0)
  public readonly baseStart = this.center.modify.west(this.arenaSize).modify.north(this.arenaSize)
  public readonly baseEnd = this.center.modify.east(this.arenaSize).modify.south(this.arenaSize)
  public readonly platformHeight = 25
  public readonly platformStart = this.center.modify.west(this.platformRadius).modify.north(this.platformRadius).modify.up(this.platformHeight + 1)
  public readonly platformEnd = this.center.modify.east(this.platformRadius).modify.south(this.platformRadius).modify.up(this.platformHeight)
  public readonly platformHoleSize = 3
  public readonly spawnRange = this.platformRadius - 1
  public readonly spawn = this.center.modify(1, this.platformStart.y + 1).modify.east(5)

  public readonly cod = item(Item.codslapper)
    .name(text('The Codslapper').bold.italic)
    .lore(
      text('Long ago, one man was slapped by a cod.'),
      text('To this day, the cod haunts the world.'),
    )

  public equip(target: string): Command[] {
    return [
      rawCmd(`replaceitem entity ${target} weapon.mainhand ${this.cod}`),
      rawCmd(`replaceitem entity ${target} weapon.offhand ${this.cod}`)
    ]
  }

  public resetPlayer(target: string): Command[] {
    return this.equip(target)
  }

  public getRandomSpawn(): Coordinates {
    return this.spawn
      .modify(0, this.getRandomPlatformAxisValue())
      .modify(2, this.getRandomPlatformAxisValue())
  }

  public getRandomPlatformAxisValue(): number {
    const spawnSide = Math.random() - 0.5 > 0 ? -1 : 1
    return randomInt(this.platformHoleSize + 2, this.spawnRange) * spawnSide
  }


}
