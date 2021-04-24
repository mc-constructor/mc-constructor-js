import { AttackedEntityEvent, AttackerType, ServerEvent, ServerEventType } from '@ts-mc/core/server-events'
import { Mob } from '@ts-mc/core/types'

import { serverEventFixture } from './server-event.fixture'

export const ATTACKED_ENTITY_DEFAULTS: Omit<AttackedEntityEvent, keyof ServerEvent> = {
  damageSource: 'something spooky',
  attackerType: AttackerType.player,
  entityId: 'somebody or something',
  entityType: Mob.cow,
}

export type AttackedEntityEventType =
  ServerEventType.livingAttack |
  ServerEventType.livingDamage |
  ServerEventType.livingDeath |
  ServerEventType.playerAttackEntity

export function attackedEntityEventFixture(
  type: AttackedEntityEventType = ServerEventType.livingAttack,
  config?: Partial<AttackedEntityEvent>): AttackedEntityEvent {
  return Object.assign(serverEventFixture(type), ATTACKED_ENTITY_DEFAULTS, config)
}
