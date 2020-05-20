import { AttackedByPlayerEvent, AttackedEntityEvent, ServerEventType } from '@ts-mc/core/server-events'
import { TypesFixtures } from '@ts-mc/core/types/testing'

import { ATTACKED_ENTITY_DEFAULTS, attackedEntityEventFixture, AttackedEntityEventType } from './attacked-entity-event.fixture'

export const ATTACKED_BY_PLAYER_DEFAULTS: Omit<AttackedByPlayerEvent, keyof AttackedEntityEvent> = Object.assign({}, ATTACKED_ENTITY_DEFAULTS, {
  attacker: TypesFixtures.playerWithHeldItems(),
})

export function attackedByPlayerEventFixture(
  type: AttackedEntityEventType = ServerEventType.entityLivingAttack,
  config?: Partial<AttackedByPlayerEvent>,
): AttackedByPlayerEvent {
  return Object.assign(attackedEntityEventFixture(type), ATTACKED_BY_PLAYER_DEFAULTS, config)
}
