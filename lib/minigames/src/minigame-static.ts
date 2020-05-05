import { ArenaRequirements } from '@ts-mc/minigames'

import { MinigameEvents } from './minigame-events'

export class MinigameStatic<TEvents extends MinigameEvents> {

  public readonly requirements = ArenaRequirements<TEvents>()

}
