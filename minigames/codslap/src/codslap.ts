import { Command } from '@minecraft/core/cmd'
import { Coordinates } from '@minecraft/core/types'
import { Minigame } from '@minecraft/minigames'

import { CodslapInitCommand } from './init'

export class CodslapMiniGame implements Minigame {

  public readonly title = 'Codslap!'
  public readonly description = 'Slap your friends with an overpowered cod.'

  public init(loc: Coordinates): Command {
    return new CodslapInitCommand(loc)
  }

}
