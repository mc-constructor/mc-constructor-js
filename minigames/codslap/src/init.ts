import { Inject, Injectable } from '@dandi/core'
import {
  addObjective,
  block,
  clear,
  clearEffect,
  FillMethod,
  gamerule,
  giveEffect,
  ObjectiveDisplaySlot,
  rawCmd,
  removeObjectives,
  setObjectiveDisplay,
  text,
  time,
  weather,
} from '@minecraft/core/cmd'
import { Command, MultiCommand, parallel, series } from '@minecraft/core/command'
import { randomInt, range } from '@minecraft/core/common'
import { Players } from '@minecraft/core/server'
import { Block, Effect } from '@minecraft/core/types'

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
export class CodslapInitCommand extends MultiCommand {

  protected readonly false = true
  protected readonly parallel = false

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(CommonCommands) private common: CommonCommands,
  ) {
    super()
  }

  public compile(): Command[] {
    return [
      this.initHoldingArea(),
      this.initRules(),
      this.initArena(),
      this.resetObjectives(),
      this.initObjectives(),
      this.initPlayers(),
      this.removeHoldingArea(),
    ]
  }

  protected initHoldingArea(): Command {
    const holding = this.common.spawn.modify.up(100)
    const holdingArea = parallel(
      block(Block.whiteWool).fill(
        holding.modify.west(this.common.arenaSize).modify.north(this.common.arenaSize),
        holding.modify.east(this.common.arenaSize).modify.south(this.common.arenaSize),
      )
    )
    return series(
      holdingArea,
      rawCmd(`teleport @a ${holding.modify.up(2)}`),
    )
  }

  protected removeHoldingArea(): Command {
    const holding = this.common.spawn.modify.up(100)
    return block(Block.air).fill(
      holding.modify.west(this.common.arenaSize).modify.north(this.common.arenaSize),
      holding.modify.east(this.common.arenaSize).modify.south(this.common.arenaSize),
    )
  }

  protected initRules(): Command {
    return parallel(
      time.set.day,
      weather.clear(), // TODO: fix accessor so it works
      gamerule.doWeatherCycle.disable,
      gamerule.doDaylightCycle.disable,
      gamerule.commandBlockOutput.disable,
      gamerule.sendCommandFeedback.enable,
      rawCmd(`setworldspawn ${this.common.spawn}`),
    )
  }

  protected resetObjectives(): Command {
    return removeObjectives('codslap', 'codslap_m_kill', 'codslap_p_kill')
  }

  protected initObjectives(): Command {
    return series(
      parallel(
        addObjective('codslap', 'dummy', text('CODSLAP!')),
        addObjective('codslap_m_kill', 'dummy'),
        addObjective('codslap_p_kill', 'dummy', text('CODSLAP KILL!').bold),
      ),
      parallel(
        setObjectiveDisplay(ObjectiveDisplaySlot.belowName, 'codslap'),
        setObjectiveDisplay(ObjectiveDisplaySlot.sidebar, 'codslap_p_kill'),
      ),
    )
  }

  protected initArena(): Command {
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
    // const platformBlock = block(Block.packedIce)
    // const platformBlock = block(Block.glass)
    const platformBlock = block(Block.bedrock)
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

    return series(
      parallel(
        rawCmd(`kill @e[type=!player]`),
        reset,
      ),
      parallel(
        cage,
        moatContainer,
      ),
      parallel(
        lava,
        platform,
      ),
      parallel(
        platformInnerVoid,
        platformHoleLip,
      ),
      platformHole,
    )
  }

  protected initPlayers(): Command {
    const playerTeleports = this.players$.players.map(player =>
      rawCmd(`teleport ${player.name} ${this.common.getRandomSpawn()}`))

    const sheepCount = randomInt(10, 20)
    const sheep = range(sheepCount).map(() =>
      rawCmd(`summon sheep ${this.common.getRandomSpawn()} {Attributes:[{Name:generic.maxHealth,Base:2}],Health:2}`))
    return parallel(
      ...playerTeleports,
      // clear only gives a response if something was cleared - need to give something to make sure clear gives a response
      clear('@a'),
      ...this.common.resetPlayer('@a'),

      clearEffect('@a'),
      giveEffect('@a', Effect.instantHealth, 10),
      rawCmd(`gamemode adventure @a`, 1500),
      rawCmd(`kill @e[type=item]`),
      ...sheep,
    )
  }

}
