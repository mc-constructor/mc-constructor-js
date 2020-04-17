import { Command } from '@minecraft/core/command'

import { Arena } from '../arena/arena'

export type Behavior = (arena: Arena) => Command
