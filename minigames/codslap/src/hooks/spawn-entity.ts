import { rawCmd } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { range } from '@minecraft/core/common'
import { Mob } from '@minecraft/core/types'

import { Arena } from '../arena/arena'

import { HookHandler } from './hook-handler'

export function summonBehavior(entityOrStuff: Mob | [Mob, string], count: number | (() => number) = 1): HookHandler<any> {
  return (arena: Arena): Command => {
    const [entity, extras] = Array.isArray(entityOrStuff) ? entityOrStuff : [entityOrStuff]
    const c = typeof count === 'number' ? count : count()
    return parallel(...range(0, c).map(() => rawCmd(`summon ${entity} ${arena.getRandomSpawn()}${extras ? ' ' : ''}${extras || ''}`)))
  }
}
