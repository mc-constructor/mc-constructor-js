import { Inject, Injectable, Logger } from '@dandi/core'
import {
  block,
  clear,
  clearEffect,
  FillMethod,
  gamerule,
  giveEffect,
  rawCmd,
  time,
  weather,
  wait,
  kill,
} from '@minecraft/core/cmd'
import { Command, MultiCommand, parallel, series } from '@minecraft/core/command'
import { Players } from '@minecraft/core/players'
import { Block, Effect } from '@minecraft/core/types'

import { ArenaManager } from './arena-manager'
import { CommonCommands } from './common'

@Injectable()
export class CodslapInitCommand extends MultiCommand {

  protected readonly false = true
  protected readonly parallel = false

  constructor(
    @Inject(Players) private players$: Players,
    @Inject(CommonCommands) private common: CommonCommands,
    @Inject(ArenaManager) private arena: ArenaManager,
    @Inject(Logger) logger: Logger,
  ) {
    super(logger)
    this.logger.debug('ctr')
  }

  public compile(): Command[] {
    return [
      this.initHoldingArea(),
      parallel(
        this.initRules(),
        this.initArena(),
      ),
      wait(1500),
      parallel(
        this.initPlayers(),
        // this.removeHoldingArea(),
      ),
    ]
  }

  protected initHoldingArea(): Command {
    const holding = this.common.holdingCenter
    const holdingArea = parallel(
      block(Block.whiteWool).fill(
        holding.modify.west(this.common.arenaSize).modify.north(this.common.arenaSize),
        holding.modify.east(this.common.arenaSize).modify.south(this.common.arenaSize),
      ),
      clear('@a'),
      clearEffect('@a'),
      giveEffect('@a', Effect.instantHealth, 10),
    )
    return series(
      holdingArea,
      wait(1500),
      rawCmd(`teleport @a ${holding.modify.up(2)}`),
      wait(2500),
    )
  }

  protected removeHoldingArea(): Command {
    const holding = this.common.holdingCenter
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
      // rawCmd(`setworldspawn ${this.common.spawn}`),
    )
  }

  protected initArena(): Command {
    const baseStart = this.common.baseStart
    const baseEnd = this.common.baseEnd
    const cage = block(Block.ironBars)
    // const cage = block(Block.bedrock)
      .box(
        baseStart.modify.up(50),
        baseEnd,
      )
    const moatContainer = block(Block.glass)
      .fill(
        baseStart.modify.up(5).modify.west(1).modify.north(1),
        baseEnd.modify.east(1).modify.south(1),
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

    return parallel(
      kill(`@e[type=!player]`),
      kill(`@e[type=item]`),
      reset,
      cage,
      moatContainer,
      lava,
    )
  }

  protected initPlayers(): Command {
    return parallel(
      this.common.resetPlayer('@a'),
      rawCmd('gamemode adventure @a', 1500),
    )
  }

}
