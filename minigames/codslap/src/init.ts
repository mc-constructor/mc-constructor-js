import { Inject, Injectable } from '@dandi/core'
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
import { Players } from '@minecraft/core/server'
import { Block, Direction, loc } from '@minecraft/core/types'

import { CommonCommands } from './common'

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
 *   - collect
 *   - cage and platform made of bedrock / hole in the middle
 *   - collecting food drops increases satiation
 *   - collecting wool heals you
 *   - collecting gunpowder grants/upgrades armor
 *   - can we detect missed attacks?
 *   - increase knockback level with successful slaps (e.g. 10 slaps = level++)
 *   - killing player takes a random piece of armor or fish if it is better
 *
 */

@Injectable()
export class CodslapInitCommand extends ComplexCommand {

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super()
  }

  public compile(): Command[] {
    return [
      ...this.initHoldingArea(),
      ...this.movePlayersToHoldingArea(),
      ...this.initRules(),
      ...this.initArena(),
      ...this.initCommandBlocks(),
      ...this.initObjectives(),
      ...this.initPlayers(),
      ...this.removeHoldingArea(),
    ]
  }

  protected initHoldingArea(): Command[] {
    const holding = this.common.spawn.modify.up(100)
    return [
      block(Block.whiteWool).fill(
        holding.modify.west(this.common.arenaSize).modify.north(this.common.arenaSize),
        holding.modify.east(this.common.arenaSize).modify.south(this.common.arenaSize),
      )
    ]
  }

  protected movePlayersToHoldingArea(): Command[] {
    const holding = this.common.spawn.modify.up(100).modify.up(1)
    return [
      rawCmd(`execute as @a run teleport @s ${holding}`)
    ]
  }

  protected removeHoldingArea(): Command[] {
    const holding = this.common.spawn.modify.up(100)
    return [
      block(Block.air).fill(
        holding.modify.west(this.common.arenaSize).modify.north(this.common.arenaSize),
        holding.modify.east(this.common.arenaSize).modify.south(this.common.arenaSize),
      )
    ]
  }

  protected initRules(): Command[] {
    return [
      time.set.day,
      weather.clear,
      gamerule.doWeatherCycle.disable,
      gamerule.doDaylightCycle.disable,
      gamerule.commandBlockOutput.disable,
      rawCmd(`setworldspawn ${this.common.spawn}`),
    ]
  }

  protected initObjectives(): Command[] {
    return [
      rawCmd(`scoreboard objectives remove hit_filter`),
      rawCmd(`scoreboard objectives add hit_filter minecraft.custom:minecraft.damage_dealt`),

      rawCmd(`scoreboard objectives remove codslap`),
      rawCmd(`scoreboard objectives add codslap dummy "CODSLAP!"`),

      // rawCmd(`scoreboard objectives remove kill_filter`, true),
      // rawCmd(`scoreboard objectives add kill_filter minecraft.custom:minecraft.playerKillCount`, true),

      // rawCmd(`scoreboard objectives remove codslap_kill`, true),
      // rawCmd(`scoreboard objectives add codslap_kill dummy "CODSLAP KILL!"`, true),

      rawCmd(`scoreboard objectives setdisplay belowName codslap`),
      rawCmd(`scoreboard objectives setdisplay sidebar codslap_kill`),
    ]
  }

  protected initArena(): Command[] {
    const baseStart = this.common.baseStart
    const baseEnd = this.common.baseEnd
    const center = this.common.center
    const cage = block(Block.ironBars)
    // const cage = block(Block.bedrock)
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

    const platformHeight = this.common.platformHeight
    const platformStart = this.common.platformStart
    const platformEnd = this.common.platformEnd
    // const platformBlock = block(Block.honeycombBlock)
    const platformBlock = block(Block.packedIce)
    // const platformBlock = block(Block.glass)
    const platform = platformBlock
      .fill(platformStart, platformEnd)

    const holeSize = this.common.platformHoleSize

    const platformHoleLip = platformBlock
      .fill(
        center.modify.west(holeSize + 1).modify.north(holeSize + 1).modify.up(this.common.platformHeight + 1),
        center.modify.east(holeSize + 1).modify.south(holeSize + 1).modify.up(this.common.platformHeight),
      )

    const platformHole = block(Block.air)
      .fill(
        center.modify.west(holeSize).modify.north(holeSize).modify.up(platformHeight + 1),
        center.modify.east(holeSize).modify.south(holeSize).modify.up(platformHeight),
      )

    const platformInnerVoid = block(Block.air)
      .fill(
        platform.start.modify.west(-1).modify.north(-1),
        platform.end.modify.east(-1).modify.south(-1).modify.up(1),
      )

    return [
      rawCmd(`kill @e[type=!player]`),
      reset,
      cage,
      moatContainer,
      lava,
      platform,
      platformInnerVoid,
      platformHoleLip,
      platformHole,
    ]
  }

  protected initPlayers(): Command[] {
    const playerTeleports = this.players$.players.map(player =>
      rawCmd(`execute as @p[name=${player.name}] run teleport ${this.common.getRandomSpawn()}`))
    return [
      ...playerTeleports,
      // rawCmd(`execute as @a run give @s cod`, true),
      // clear only gives a response if something was cleared - need to give something to make sure clear gives a response
      rawCmd(`execute as @a run clear`),
      ...this.common.resetPlayer('@a'),

      rawCmd(`execute as @a run effect clear @s`),
      rawCmd(`execute as @a run effect give @s instant_health 10`),
      rawCmd(`gamemode survival @a`),
      // rawCmd(`gamemode creative @a`, true),
    ]
  }

  protected initCommandBlocks(): Command[] {
    const cmdBlockCenter = this.common.center.modify(1, 0).modify.west(3)

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

    // tips for figuring out who slapped whom - use a command block that finds the nearest player to the slapper
    // could be inaccurate due to knockback?
    // https://gaming.stackexchange.com/questions/258135/a-minecraft-poison-sword

    // const killFilterReset =
    //   block(Block.chainCommandBlock)
    //     .command('execute as @[scores={kill_filter=1..}] run scoreboard players reset @s kill_filter')
    //     .facing(Direction.south)
    //     .autoSignal(AutoSignal.alwaysActive)
    //     .conditional(true)
    //     .set(cmdBlockCenter.modify.west(1))
    //
    // const killTracker =
    //   block(Block.repeatingCommandBlock)
    //     .command('execute as @a[scores={kill_filter=1..}]')

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
