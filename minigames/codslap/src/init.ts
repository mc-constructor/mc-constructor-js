import {
  AutoSignal,
  block,
  Command,
  ComplexCommand,
  FillMethod,
  gamerule,
  rawCmd,
  time,
  weather
} from '@minecraft/core/cmd'
import { Block, Coordinates, Direction, loc } from '@minecraft/core/types'

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

/*
 * ideas:
 *   - ice platform
 *   - platform shrinks
 *   - randomly spawn creepers / tnt minecart (use data to make it less explosive?)
 */

export class CodslapInitCommand extends ComplexCommand {

  constructor(public readonly center: Coordinates, public readonly arenaSize = DEFAULT_ARENA_SIZE) {
    super()
  }

  public compile(): Command[] {
    return [
      ...this.initRules(),
      ...this.initArena(),
      ...this.initCommandBlocks(),
      ...this.initObjectives(),
      ...this.initPlayers(),
    ]
  }

  protected initRules(): Command[] {
    const spawn = this.center.modify(1,  27)
    return [
      time.set.day,
      weather.clear,
      gamerule.doWeatherCycle.disable,
      gamerule.doDaylightCycle.disable,
      gamerule.commandBlockOutput.enable,
      rawCmd(`setworldspawn ${spawn}`, true),
    ]
  }

  protected initObjectives(): Command[] {
    return [
      rawCmd(`scoreboard objectives remove hit_filter`, true),
      rawCmd(`scoreboard objectives remove codslap`, true),
      rawCmd(`scoreboard objectives add hit_filter minecraft.custom:minecraft.damage_dealt`, true),
      rawCmd(`scoreboard objectives add codslap trigger "CODSLAP!"`, true),
      rawCmd(`scoreboard objectives setdisplay sidebar codslap`, true),
    ]
  }

  protected initArena(): Command[] {
    const baseStart = this.center.modify.west(this.arenaSize).modify.north(this.arenaSize)
    const baseEnd = this.center.modify.east(this.arenaSize).modify.south(this.arenaSize)
    const cage = block(Block.ironBars)
      .box(
        baseStart.modify.up(50),
        baseEnd,
      )
    const moatContainer = block(Block.soulSand)
      .fill(
        baseStart.modify.up(5),
        baseEnd,
        FillMethod.outline,
      )
    const lava = block(Block.lava)
      .fill(
        moatContainer.start.modify.west(-1).modify.north(-1),
        moatContainer.end.modify.east(-1).modify.south(-1).modify.down(-1),
      )

    const reset = block(Block.air)
      .fill(
        cage.start.modify.up(25).modify.west(25).modify.north(25),
        cage.end.modify.down(25).modify.east(25).modify.south(25),
      )

    const platformRadius = Math.floor(this.arenaSize / 4)
    const platform = block(Block.netherrack)
      .fill(
        this.center.modify.west(platformRadius).modify.north(platformRadius).modify.up(25),
        this.center.modify.east(platformRadius).modify.south(platformRadius).modify.up(25),
      )

    const spawn = this.center.modify(1, platform.start.y + 2)

    return [
      reset,
      cage,
      moatContainer,
      lava,
      platform,
      rawCmd(`spawnpoint @a ${spawn}`, true),
      rawCmd(`summon sheep ${spawn}`, true),
      rawCmd(`summon sheep ${spawn}`, true),
      rawCmd(`summon sheep ${spawn}`, true),
      rawCmd(`summon sheep ${spawn}`, true),
    ]
  }

  protected initPlayers(): Command[] {
    return [
      // rawCmd<string>(`execute as @a run teleport @s ${this.center.modify.up(100)}`, true)
      rawCmd(`execute as @a run clear`, true),
      rawCmd(`execute as @a run give @s cod{Enchantments:[{id:knockback,lvl:50}]}`, true),
      rawCmd(`teleport @a ${this.center.modify.up(27)}`, true),
      rawCmd(`gamemode survival @a`, true),
    ]
  }

  protected initCommandBlocks(): Command[] {
    const cmdBlockCenter = this.center.modify(1, 0).modify.west(3)

    const slapFilterReset =
      block(Block.chainCommandBlock)
        .command('execute as @a[scores={hit_filter=1..}] run scoreboard players reset @s hit_filter')
        .facing(Direction.south)
        .autoSignal(AutoSignal.alwaysActive)
        .conditional(true)
        .set(cmdBlockCenter)

    const slapTracker = block(Block.repeatingCommandBlock)
      .command('execute as @a[scores={hit_filter=1..},nbt={SelectedItem:{id:\'minecraft:cod\'}}] run scoreboard players add @s codslap 1')
      .facing(slapFilterReset.loc)
      .autoSignal(AutoSignal.alwaysActive)
      .set(slapFilterReset.loc.modify.south(-1))
      // .backup()
        // .backup()

    return [
      // reset entire target area to avoid "Cannot place block" if command block locations already have the same kind of block
      block(Block.bedrock).fill(loc(-10, 0, -10), loc(10, 1, 10)),
      slapTracker,
      slapFilterReset,
    ]
  }

  protected compileResponse(cmdResponses: any[]): void {
    return undefined
  }

}
