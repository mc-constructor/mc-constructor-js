import { Inject, Injectable, Logger } from '@dandi/core'
import {
  block,
  clear,
  clearEffect,
  FillMethod,
  gamerule,
  rawCmd,
  time,
  weather,
  wait,
  kill,
} from '@ts-mc/core/cmd'
import { CommandRequest, parallel, series } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { Block } from '@ts-mc/core/types'

import { CodslapCommonCommands } from './codslap-common-commands'

@Injectable()
export class CodslapInit {

  constructor(
    @Inject(Players) private players: Players,
    @Inject(CodslapCommonCommands) private common: CodslapCommonCommands,
    @Inject(Logger) private logger: Logger,
  ) {
    this.logger.debug('ctr')
  }

  public compile(): CommandRequest {
    return series(
      'codslap.compile',
      this.common.initHoldingArea(),
      parallel(
        'codslap.compile.rulesAndArena',
        this.initRules(),
        this.initArena(),
      ),
      wait(1500),
      parallel(
        'codslap.initRules.initPlayers',
        this.initPlayers(),
        // this.removeHoldingArea(),
      ),
    )
  }

  protected initRules(): CommandRequest {
    return parallel(
      'codslap.initRules',
      time.set.day,
      weather.clear,
      gamerule.doWeatherCycle.disable,
      gamerule.doDaylightCycle.disable,
      gamerule.commandBlockOutput.disable,
      gamerule.sendCommandFeedback.enable,
      // rawCmd(`setworldspawn ${this.common.spawn}`),
    )
  }

  protected initArena(): CommandRequest {
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
      'codslap.initArena',
      kill(`@e[type=!player]`),
      kill(`@e[type=item]`),
      reset,
      cage,
      moatContainer,
      lava,
    )
  }

  protected initPlayers(): CommandRequest {
    return parallel(
      'codslap.initPlayers',
      this.common.resetPlayer('@a'),
      rawCmd('gamemode adventure @a', 1500),
    )
  }

}
