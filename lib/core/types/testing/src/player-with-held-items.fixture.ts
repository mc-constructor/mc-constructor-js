import { PlayerWithHeldItems, Player, Item } from '@ts-mc/core/types'

import { playerFixture } from './player.fixture'

const PLAYER_WITH_HELD_ITEMS_DEFAULTS: Omit<PlayerWithHeldItems, keyof Player> & { name: string } = {
  name: 'somebody',
  mainHand: {
    item: Item.cod,
  },
  offHand: {
    item: Item.cod,
  }
}

export function playerWithHeldItemsFixture(config?: Partial<PlayerWithHeldItems>): PlayerWithHeldItems {
  return Object.assign(playerFixture(), PLAYER_WITH_HELD_ITEMS_DEFAULTS, config)
}
