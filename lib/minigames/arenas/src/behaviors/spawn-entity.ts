import { rawCmd } from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { range } from '@ts-mc/common'
import { Mob } from '@ts-mc/core/types'
import { MinigameEvents } from '@ts-mc/minigames'

import { Arena } from '../arena'

import { HookHandler } from './hook-handler'

export function summonBehavior(entityOrSpec: Mob | [Mob, string], count: number | (() => number) = 1): HookHandler<any> {
  return <TEvents extends MinigameEvents>(arena: Arena<TEvents>): CommandRequest => {
    const [entity, extras] = Array.isArray(entityOrSpec) ? entityOrSpec : [entityOrSpec]
    const c = typeof count === 'number' ? count : count()
    return parallel(...range(0, c).map(() => rawCmd(`summon ${entity} ${arena.getRandomSpawn()}${extras ? ' ' : ''}${extras || ''}`)))
  }
}
