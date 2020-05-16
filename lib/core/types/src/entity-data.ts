import { AnyEntity } from './entity'
import { Mob } from './mob'
import { BaseEntityData, CreeperData } from './specific-entity-data'

export interface EntityDataMap {
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
