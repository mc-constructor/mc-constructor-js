import { AutoSignal, block, Command, ComplexCommand, gamerule, rawCmd, time, weather } from '@minecraft/core/cmd'
import { Block, Direction, Coordinates } from '@minecraft/core/types'

export const DEFAULT_ARENA_SIZE = 25


  // return [
  //   // `scoreboard objectives remove hit_filter`,
  //   // `scoreboard objectives remove codslap`,
  //   `scoreboard objectives add hit_filter minecraft.custom:minecraft.damage_dealt`,
  //   `scoreboard objectives add codslap trigger "CODSLAP!"`,
  //   `scoreboard objectives setdisplay sidebar codslap`,
  //   backup(SetCommandBlockCommand.create(
  //     'execute as @a[scores={hit_filter=1..},nbt={SelectedItem:{id:\'minecraft:cod\'}}] run scoreboard players add @s codslap 1',
  //     loc,
  //     CommandBlockType.repeating,
  //   )
  //     .facing(Facing.north)
  //     .autoSignal(AutoSignal.alwaysActive)
  //   ).compile(),
  //   backup(SetCommandBlockCommand.create(
  //     'execute as @a[scores={hit_filter=1..}] run scoreboard players reset @s hit_filter',
  //     loc.modify(2, loc.z.minus(1)),
  //     CommandBlockType.chain,
  //   )
  //     .facing(Facing.north)
  //     .conditional(true)
  //     .autoSignal(AutoSignal.alwaysActive)
  //   ).compile(),
  //   `give @a cod`
  // ]


export class CodslapInitCommand extends ComplexCommand {

  constructor(public readonly center: Coordinates, public readonly arenaSize = DEFAULT_ARENA_SIZE) {
    super()
  }

  public compile(): Command<any>[] {
    return [
      ...this.initRules(),
      ...this.initArena(),
      ...this.initCommandBlocks(),
      ...this.initPlayers(),
    ]
  }

  protected initRules(): Command[] {
    return [
      time.set.day,
      weather.clear,
      gamerule.doWeatherCycle.disable,
      gamerule.doDaylightCycle.disable,
    ]
  }

  protected initArena(): Command[] {
    return [
    ]
  }

  protected initPlayers(): Command[] {
    return [
      rawCmd('teleport @a 0 100 0')
    ]
  }

    //   backup(SetCommandBlockCommand.create(
  //     'execute as @a[scores={hit_filter=1..},nbt={SelectedItem:{id:\'minecraft:cod\'}}] run scoreboard players add @s codslap 1',
  //     loc,
  //     CommandBlockType.repeating,
  //   )
  //     .facing(Facing.north)
  //     .autoSignal(AutoSignal.alwaysActive)
  //   ).compile(),
  //   backup(SetCommandBlockCommand.create(
  //     'execute as @a[scores={hit_filter=1..}] run scoreboard players reset @s hit_filter',
  //     loc.modify(2, loc.z.minus(1)),
  //     CommandBlockType.chain,
  //   )
  //     .facing(Facing.north)
  //     .conditional(true)
  //     .autoSignal(AutoSignal.alwaysActive)
  //   ).compile(),

  protected initCommandBlocks(): Command[] {
    const cmdBlockCenter = this.center.modify(1, 0)
    const slapTracker = block(Block.repeatingCommandBlock)
      .command('execute as @a[scores={hit_filter=1..},nbt={SelectedItem:{id:\'minecraft:cod\'}}] run scoreboard players add @s codslap 1')
      .facing(Direction.north)
      .autoSignal(AutoSignal.alwaysActive)
      .set(cmdBlockCenter)
      .backup()

    const slapFilterReset =
      block(Block.chainCommandBlock)
        .command('execute as @a[scores={hit_filter=1..}] run scoreboard players reset @s hit_filter')
        .facing(slapTracker.loc)
        .autoSignal(AutoSignal.alwaysActive)
        .conditional(true)
        .set(slapTracker.loc.modify.south(-1))

    return [
      slapTracker,
      slapFilterReset,
    ]
  }

  protected compileResponse(cmdResponses: any[]): void {
    return undefined
  }

}
