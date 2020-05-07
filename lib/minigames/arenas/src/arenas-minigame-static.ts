import { MinigameEvents } from '@ts-mc/minigames'

import { ArenaRequirements } from './arena-requirements'

export class ArenasMinigameStatic<TEvents extends MinigameEvents> {

  public readonly requirements = ArenaRequirements<TEvents>()

}
