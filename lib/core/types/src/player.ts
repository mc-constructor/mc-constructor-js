import { Item } from './item'

export interface Player {
  name: string
  uuid: string
}

export interface HeldItem {
  item: Item
  itemName?: string
}

export interface PlayerWithHeldItems extends Player {
  mainHand: HeldItem
  offHand: HeldItem
}
