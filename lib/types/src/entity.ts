import { EntityBlock } from './entity-block'
import { Mob } from './mob'
import { Projectile } from './projectile'
import { Vehicle } from './vehicle'
import { EntityItem } from './entity-item'

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
}

export type EntityMap = Entity & typeof MiscEntity

export const Entity: EntityMap = Object.defineProperties(MiscEntity, {
  block: { get: () => EntityBlock },
  item: { get: () => EntityItem },
  mob: { get: () => Mob },
  projectile: { get: () => Projectile },
  vehicle: { get: () => Vehicle },
})
