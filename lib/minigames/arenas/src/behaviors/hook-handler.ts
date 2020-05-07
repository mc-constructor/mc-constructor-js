import { CommandRequest } from '@ts-mc/core/command'
import { MinigameEvents } from '@ts-mc/minigames'

import { Arena } from '../arena'

export type HookHandler<TEvent> = <TEvents extends MinigameEvents>(arena: Arena<TEvents>, event: TEvent) => CommandRequest
