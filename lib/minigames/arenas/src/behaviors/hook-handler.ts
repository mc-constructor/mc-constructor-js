import { CommandRequest } from '@ts-mc/core/command'
import { MinigameEvents } from '@ts-mc/minigames'

import { Arena } from '../arena'

export interface HookHandlerArgs<TEvents extends MinigameEvents> {
  arena: Arena<TEvents>,
  event: any,
  events: TEvents,
}

export type HookHandler<TEvent> = <TEvents extends MinigameEvents>(args: HookHandlerArgs<TEvents>) => CommandRequest
