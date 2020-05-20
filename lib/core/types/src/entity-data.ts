import { AnyEntity } from './entity'
import { EntityBlock } from './entity-block'
import { Mob } from './mob'
import { BaseEntityData, CreeperData, TntBlockEntityData } from './specific-entity-data'

export interface EntityDataMap {
  [EntityBlock.tnt]: TntBlockEntityData
  [Mob.creeper]: CreeperData
}

export type EntityData = {
  [TEntity in AnyEntity]: TEntity extends keyof EntityDataMap ? EntityDataMap[TEntity] : BaseEntityData
}

export interface NbtData {
  toNbtString(): string
}

export function isNbtData(obj: any): obj is NbtData {
  return typeof obj === 'object' && typeof obj.toNbtString === 'function'
}
