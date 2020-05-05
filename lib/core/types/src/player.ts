import { Uuid } from '@dandi/common'

import { Item } from './item'

export interface Player {
  name: string
  uuid: Uuid
}

export interface HeldItem {
  item: Item
  itemName?: string
}

export interface PlayerWithHeldItems extends Player {
  mainHand: HeldItem
  offHand: HeldItem
}
