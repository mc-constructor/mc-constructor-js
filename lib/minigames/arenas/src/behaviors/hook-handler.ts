import { CommandRequest } from '@ts-mc/core/command'
import { Players } from '@ts-mc/core/players'
import { MinigameEvents } from '@ts-mc/minigames'

import { Arena } from '../arena'

export interface HookHandlerArgs<TEvents extends MinigameEvents> {
  arena: Arena<TEvents>,
  event: any,
  players: Players,
}

export type HookHandler<TEvent> = <TEvents extends MinigameEvents>(args: HookHandlerArgs<TEvents>) => CommandRequest
