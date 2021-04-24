import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'
import { AnyEntity, Coordinates, EntityData } from '@ts-mc/core/types'

import { snbt } from './snbt'

// https://minecraft.gamepedia.com/Commands/summon

export interface SummonCommand<TEntity extends AnyEntity> extends CommandRequest {
  readonly entity: TEntity
  readonly loc: Coordinates
  readonly nbt: EntityData[TEntity]
}

class SummonCommandRequest<TEntity extends AnyEntity> extends SimpleArgsCommandRequest {

  protected readonly command = 'summon'

  constructor(
    public readonly entity: TEntity,
    public readonly loc: Coordinates,
    public readonly nbt: EntityData[TEntity],
  ) {
    super(entity, loc, snbt(nbt))
  }

}

export function isSummonCommand(obj: any): obj is SummonCommand<AnyEntity> {
  return obj instanceof SummonCommandRequest;
}

export function summon<TEntity extends AnyEntity>(entity: TEntity, loc: Coordinates, nbt?: EntityData[TEntity]): SummonCommand<TEntity> {
  return new SummonCommandRequest(entity, loc, nbt)
}
