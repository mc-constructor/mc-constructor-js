import { Inject, Injectable } from '@dandi/core'
import {
  block,
  Command,
  ComplexCommand,
  FillMethod,
  gamerule,
  rawCmd,
  time,
  weather
} from '@minecraft/core/cmd'
import { randomInt, range } from '@minecraft/core/common'
import { Players } from '@minecraft/core/server'
import { Block } from '@minecraft/core/types'

import { CommonCommands } from './common'

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
      rawCmd(`teleport @a ${holding}`)
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
      gamerule.sendCommandFeedback.enable,
      rawCmd(`setworldspawn ${this.common.spawn}`),
    ]
  }

  protected initObjectives(): Command[] {
    return [
      rawCmd(`scoreboard objectives remove codslap`),
      rawCmd(`scoreboard objectives add codslap dummy "CODSLAP!"`),

      rawCmd(`scoreboard objectives remove codslap_mob_kill`),
      rawCmd(`scoreboard objectives add codslap_mob_kill dummy`),

      rawCmd(`scoreboard objectives remove codslap_kill`),
      rawCmd(`scoreboard objectives add codslap_kill dummy "CODSLAP KILL!"`),

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
    const moatContainer = block(Block.glass)
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
      rawCmd(`teleport ${player.name} ${this.common.getRandomSpawn()}`))

    const sheepCount = randomInt(10, 20)
    const sheep = range(sheepCount).map(() =>
      rawCmd(`summon sheep ${this.common.getRandomSpawn()} {Attributes:[{Name:generic.maxHealth,Base:2}],Health:2}`))
    return [
      ...playerTeleports,
      // clear only gives a response if something was cleared - need to give something to make sure clear gives a response
      rawCmd(`clear @a`),
      ...this.common.resetPlayer('@a'),

      rawCmd(`effect clear @a`),
      rawCmd(`effect give @a instant_health 10`),
      rawCmd(`gamemode survival @a`, 1500),
      rawCmd(`kill @e[type=item]`),
      ...sheep,
      // rawCmd(`gamemode creative @a`, true),
    ]
  }

}
