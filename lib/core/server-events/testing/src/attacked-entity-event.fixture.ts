import { AttackedEntityEvent, AttackerType, ServerEvent, ServerEventType } from '@ts-mc/core/server-events'

import { serverEventFixture } from './server-event.fixture'

export const ATTACKED_ENTITY_DEFAULTS: Omit<AttackedEntityEvent, keyof ServerEvent> = {
  damageSource: 'something spooky',
  attackerType: AttackerType.player,
  entityId: 'somebody or something',
}

export type AttackedEntityEventType =
  ServerEventType.entityLivingAttack |
  ServerEventType.entityLivingDamage |
  ServerEventType.entityLivingDeath |
  ServerEventType.playerAttackEntity

export function attackedEntityEventFixture(
  type: AttackedEntityEventType = ServerEventType.entityLivingAttack,
  config?: Partial<AttackedEntityEvent>): AttackedEntityEvent {
  return Object.assign(serverEventFixture(type), ATTACKED_ENTITY_DEFAULTS, config)
}
