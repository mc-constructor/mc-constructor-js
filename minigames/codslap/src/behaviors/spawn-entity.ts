import { rawCmd } from '@minecraft/core/cmd'
import { Command, parallel } from '@minecraft/core/command'
import { range } from '@minecraft/core/common'
import { Mob } from '@minecraft/core/types'

import { Arena } from '../arena/arena'

import { Behavior } from './behavior'

export function summonBehavior(entity: Mob, count: number | (() => number) = 1): Behavior {
  return (arena: Arena): Command => {
    const c = typeof count === 'number' ? count : count()
    return parallel(...range(0, c).map(() => rawCmd(`summon ${entity} ${arena.getRandomSpawn()}`)))
  }
}
