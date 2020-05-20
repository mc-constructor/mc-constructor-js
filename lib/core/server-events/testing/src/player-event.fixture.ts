import { PlayerEvent, ServerEvent, ServerEventType } from '@ts-mc/core/server-events'
import { serverEventFixture } from '@ts-mc/core/server-events/testing'
import { TypesFixtures } from '@ts-mc/core/types/testing'

export type PlayerEventType =
  ServerEventType.playerAttackEntity |
  ServerEventType.playerEntityItemPickup |
  ServerEventType.playerLeftClickBlock |
  ServerEventType.playerLeftClickEmpty |
  ServerEventType.playerItemPickup |
  ServerEventType.playerJoined |
  ServerEventType.playerLeft |
  ServerEventType.playerRespawn

export const PLAYER_DEFAULTS: Omit<PlayerEvent, keyof ServerEvent> = {
  player: TypesFixtures.playerWithHeldItems()
}

export function playerEventFixture(
  type: PlayerEventType = ServerEventType.playerAttackEntity,
  config?: Partial<PlayerEvent>
): PlayerEvent {
  return Object.assign(serverEventFixture(type), PLAYER_DEFAULTS, config)
}
