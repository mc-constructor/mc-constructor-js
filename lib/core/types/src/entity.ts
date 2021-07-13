import { EntityBlock } from './entity-block'
import { EntityItem } from './entity-item'
import { Mob } from './mob'
import { Projectile } from './projectile'
import { Vehicle } from './vehicle'
import { defineObject } from '@ts-mc/common'

export enum MiscEntity {
  areaEffectCloud = 'minecraft:area_effect_cloud',
  armorStand = 'minecraft:armor_stand',
  endCrystal = 'minecraft:end_crystal',
  evokerFangs = 'minecraft:evoker_fangs',
  fishingBobber = 'minecraft:fishing_bobber',
  itemFrame = 'minecraft:item_frame',
  leashKnot = 'minecraft:leash_knot',
  lightningBolt = 'minecraft:lightning_bolt',
  painting = 'minecraft:painting',
}

export interface Entity {
  readonly block: typeof EntityBlock
  readonly item: typeof EntityItem
  readonly mob: typeof Mob
  readonly projectile: typeof Projectile
  readonly vehicle: typeof Vehicle
  readonly misc: typeof MiscEntity
}

export type AnyEntity = EntityBlock | EntityItem | MiscEntity | Mob | Projectile | Vehicle

export function entityTypeFromEntityId<TEntity extends AnyEntity>(entityId: string): TEntity {
  return entityId.replace(/^entity\./, '').replace(/\./g, ':') as TEntity
}

export const Entity: Entity = defineObject({}, {
  block: { get: () => EntityBlock },
  item: { get: () => EntityItem },
  mob: { get: () => Mob },
  projectile: { get: () => Projectile },
  vehicle: { get: () => Vehicle },
  misc: { get: () => MiscEntity },
})
