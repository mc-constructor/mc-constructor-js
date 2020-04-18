import { Command } from '@minecraft/core/command'

import { Arena } from '../arena/arena'

export type HookHandler<TEvent> = (arena: Arena, event: TEvent) => Command
