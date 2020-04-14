import { Uuid } from '@dandi/common'

import { Item } from '../../../types'

import { Player } from '../player'

import { ServerEvent } from './server-event'

export interface HeldItem {
  item: Item
  itemName?: string
}

export interface PlayerWithHeldItems extends Player {
  mainHand: HeldItem
  offHand: HeldItem
}

/** @internal */
export function parseHeldItem(raw: string): HeldItem {
  const [itemRaw, itemName] = raw.split('|')
  const item = itemRaw as Item
  return {
    item,
    itemName,
  }
}

/** @internal */
export function parsePlayerWithHeldItems(event: ServerEvent): [PlayerWithHeldItems, string[]] {
  const [playerRaw, mainHandRaw, offHandRaw, ...extras] = event.extras
  const [name, uuidRaw] = playerRaw.split(' ')
  const uuid = Uuid.for(uuidRaw.substring(1, uuidRaw.length - 1))
  const mainHand: HeldItem = parseHeldItem(mainHandRaw)
  const offHand: HeldItem = parseHeldItem(offHandRaw)
  const player: PlayerWithHeldItems = {
    name,
    uuid,
    mainHand,
    offHand
  }
  return [player, extras]
}
