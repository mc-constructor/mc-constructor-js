import { Inject, Injectable, Logger } from '@dandi/core'
import {
  block,
  FillMethod,
  forceLoadAdd,
  gamerule,
  kill,
  rawCmd,
  time,
  weather,
} from '@ts-mc/core/cmd'
import { CommandRequest, parallel, series } from '@ts-mc/core/command'
import { Block } from '@ts-mc/core/types'

import { CodslapCommonCommands } from './codslap-common-commands'

@Injectable()
export class CodslapInit {

  constructor(
    @Inject(CodslapCommonCommands) private common: CodslapCommonCommands,
    @Inject(Logger) private logger: Logger,
  ) {
    this.logger.debug('ctr')
  }

  public compile(): CommandRequest {
    return series(
      'codslap.compile',
      parallel(
        'codslap.compile.rulesAndArena',
        this.initRules(),
        this.initArena(),
      ),
      this.initPlayers(),
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
      gamerule.doMobSpawning.disable,
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

    return series(
      forceLoadAdd(reset.start, reset.end),
      parallel(
        'codslap.initArena',
        kill(`@e[type=!player]`),
        kill(`@e[type=item]`),
        reset,
        cage,
        moatContainer,
        lava,
      ),
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
