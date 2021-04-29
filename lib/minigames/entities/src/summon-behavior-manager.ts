import { Inject, Injectable, RestrictScope } from '@dandi/core'
import { range } from '@ts-mc/common'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { summon } from '@ts-mc/core/cmd'
import { AnyEntity, EntityData, Mob } from '@ts-mc/core/types'
import { GameScope, MinigameEvents } from '@ts-mc/minigames'
import { HookHandler, HookHandlerArgs } from '@ts-mc/minigames/behaviors'

import { SummonedEntityManager } from './summoned-entity-manager'
import { NumberFn, SummonCount } from './summon-count'
import { map } from 'rxjs/operators'

@Injectable(RestrictScope(GameScope))
export class SummonBehaviorManager {
  constructor(@Inject(SummonedEntityManager) private readonly entityManager: SummonedEntityManager) {
  }

  protected getNumber(n: number | NumberFn, defaultValue: number): number {
    if (typeof n === 'undefined') {
      return defaultValue
    }
    if (typeof n === 'number') {
      return n
    }
    return n()
  }

  protected getSummonCount(args: HookHandlerArgs<any>, count: SummonCount): number {
    if (typeof count === 'number') {
      return count
    }
    if (typeof count === 'function') {
      return count(args)
    }
    const playerCount = args.events.players.length
    const base = this.getNumber(count.base, 1)
    const playerBonus = this.getNumber(count.playerBonus, 0)
    const playerMultiplier = this.getNumber(count.playerMultiplier, 0)
    const totalPlayerMultiplier = (playerMultiplier * playerCount) || 1
    return (base + (playerBonus * playerCount)) * totalPlayerMultiplier
  }

  public createBehavior<TEntity extends AnyEntity, TEvents extends MinigameEvents>(
    entityOrSpec: TEntity | [TEntity, EntityData[TEntity]],
    count: SummonCount = 1,
  ): HookHandler<TEvents> {
    const [entity, data] = Array.isArray(entityOrSpec) ? entityOrSpec : [entityOrSpec, {} as EntityData[TEntity]]
    return (args: HookHandlerArgs<TEvents>): CommandRequest => {
      const c = this.getSummonCount(args, count)
      return parallel(...range(0, c).map(() => {
        const spawn = args.getRandomSpawn()
        if (!data.Tags) {
          data.Tags = []
        }
        data.Tags.push('summoned')
        return summon(entity, spawn, data)
      }))
    }
  }

  public createMobBehavior<TMob extends Mob, TEvents extends MinigameEvents>(
    mobOrSpec: TMob | [TMob, EntityData[TMob]],
    count: SummonCount = 1,
  ): HookHandler<TEvents> {
    const [mob] = Array.isArray(mobOrSpec) ? mobOrSpec : [mobOrSpec, {} as EntityData[TMob]]
    const handler = this.createBehavior(mobOrSpec, count)
    handler.triggerFilter = () => this.entityManager.getAvailableSpawn(mob).pipe(map(event => event.count > 0))
    return handler
  }

}
