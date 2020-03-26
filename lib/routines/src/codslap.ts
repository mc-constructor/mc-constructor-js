import { Facing, Location } from '../../types'
import { AutoSignal, CommandBlockType, SetCommandBlockCommand } from '../../cmd'
import { backup } from '../../cmd/src/backup-block'

export function setupCodslap(loc: Location): string[] {
  return [
    // `scoreboard objectives remove hit_filter`,
    // `scoreboard objectives remove codslap`,
    `scoreboard objectives add hit_filter minecraft.custom:minecraft.damage_dealt`,
    `scoreboard objectives add codslap trigger "CODSLAP!"`,
    `scoreboard objectives setdisplay sidebar codslap`,
    backup(SetCommandBlockCommand.create(
      'execute as @a[scores={hit_filter=1..},nbt={SelectedItem:{id:\'minecraft:cod\'}}] run scoreboard players add @s codslap 1',
      loc,
      CommandBlockType.repeating,
    )
      .facing(Facing.north)
      .autoSignal(AutoSignal.alwaysActive)
    ).compile(),
    backup(SetCommandBlockCommand.create(
      'execute as @a[scores={hit_filter=1..}] run scoreboard players reset @s hit_filter',
      loc.modify(2, loc.z.minus(1)),
      CommandBlockType.chain,
    )
      .facing(Facing.north)
      .conditional(true)
      .autoSignal(AutoSignal.alwaysActive)
    ).compile(),
    `give @a cod`
  ]
}
