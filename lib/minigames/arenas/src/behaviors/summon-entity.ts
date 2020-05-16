import { summon } from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { range } from '@ts-mc/common'
import { AnyEntity, EntityData } from '@ts-mc/core/types'

import { HookHandler, HookHandlerArgs } from './hook-handler'

export type NumberFn = () => number

export interface SummonCountConfig {
  base: number | NumberFn
  playerMultiplier?: number | NumberFn
  playerBonus?: number | NumberFn
}

export interface SummonCountFn {
  (args: HookHandlerArgs<any>): number
}

export type SummonCount = SummonCountConfig | SummonCountFn | number

function getNumber(n: number | NumberFn, defaultValue: number): number {
  if (typeof n === 'undefined') {
    return defaultValue
  }
  if (typeof n === 'number') {
    return n
  }
  return n()
}

function getSummonCount(args: HookHandlerArgs<any>, count: SummonCount): number {
  if (typeof count === 'number') {
    return count
  }
  if (typeof count === 'function') {
    return count(args)
  }
  const playerCount = args.players.players.length
  const base = getNumber(count.base, 1)
  const playerBonus = getNumber(count.playerBonus, 0)
  const playerMultiplier = getNumber(count.playerMultiplier, 0)
  const totalPlayerMultiplier = (playerMultiplier * playerCount) || 1
  return (base + (playerBonus * playerCount)) * totalPlayerMultiplier
}

export function summonBehavior<TEntity extends AnyEntity>(entityOrSpec: TEntity | [TEntity, EntityData[TEntity]], count: SummonCount = 1): HookHandler<any> {
  return (args: HookHandlerArgs<any>): CommandRequest => {
    const [entity, data] = Array.isArray(entityOrSpec) ? entityOrSpec : [entityOrSpec, {}]
    const c = getSummonCount(args, count)
    return parallel(...range(0, c).map(() => {
      const spawn = args.arena.getRandomSpawn()
      if (!data.Tags) {
        data.Tags = []
      }
      data.Tags.push('codslap')
      return summon(entity, spawn, data)
    }))
  }
}
