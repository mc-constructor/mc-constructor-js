import { parsePlayerWithHeldItems, PlayerWithHeldItems } from './player'
import { ServerEvent } from './server-event'

export interface PlayerEvent extends ServerEvent {
  player: PlayerWithHeldItems
}

/** @internal */
export function parsePlayerEvent(event: ServerEvent): PlayerEvent {
  const [player, extras] = parsePlayerWithHeldItems(event)
  return Object.assign(event, {
    player,
    extras,
  })
}
