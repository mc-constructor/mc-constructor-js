import { Command } from '@minecraft/core/cmd'
import { Coordinates } from '@minecraft/core/types'

export interface Minigame {

  // TODO: move these to decorators?
  readonly title: string
  readonly description?: string

  init(loc: Coordinates): Command

}
