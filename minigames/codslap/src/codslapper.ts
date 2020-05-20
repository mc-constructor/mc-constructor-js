import { Item } from '@ts-mc/core/types'

export type Codslapper = Item.codslapper | Item.diamondCodslapper | Item.goldCodslapper | Item.ironCodslapper | Item.stoneCodslapper | Item.woodenCodslapper

export const LEVELED_WEAPONS: [Codslapper, Codslapper, Codslapper, Codslapper, Codslapper, Codslapper] = [
  Item.codslapper,
  Item.diamondCodslapper,
  Item.goldCodslapper,
  Item.ironCodslapper,
  Item.stoneCodslapper,
  Item.woodenCodslapper,
]

export function isCodslapper(item: any): item is Codslapper {
  return LEVELED_WEAPONS.includes(item)
}
