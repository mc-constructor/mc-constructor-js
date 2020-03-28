import { Coordinates } from '@minecraft/core/types'
import { Command } from '@minecraft/core/cmd'
import { Minigame } from '@minecraft/minigames'

export class TestMiniGame implements Minigame {
  readonly title: string

  init(loc: Coordinates): Command {
    return undefined
  }

  validateGameState(): Command {
    return undefined
  }

}
