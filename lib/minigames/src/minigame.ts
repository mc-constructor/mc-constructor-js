import { Command } from '../../cmd'

export interface Minigame {

  // TODO: move these to decorators?
  readonly title: string
  readonly description?: string

  init(): Command

}
