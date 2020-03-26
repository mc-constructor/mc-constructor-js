import { Minigame } from '../../'
import { Command } from '../../../cmd'

export class CodslapMiniGame implements Minigame {

  public readonly title = 'Codslap!'
  public readonly description = 'Slap your friends with an overpowered '

  init(): Command<void> {
    return undefined;
  }



}
