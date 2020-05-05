import { PlayerWithHeldItems } from '@ts-mc/core/types'

import { parsePlayerWithHeldItems } from './player'
import { ServerEvent } from './server-event'

export interface EntityEvent extends ServerEvent {
  entityId: string
}

export enum AttackerType {
  player = 'player',
}

export interface AttackedEntityEvent extends EntityEvent {
  damageSource: string
  attackerType: AttackerType | string
}

export interface AttackedByPlayerEvent extends AttackedEntityEvent {
  attacker: PlayerWithHeldItems
}

/** @internal */
export type AttackedByEntityEventType = {
  [AttackerType.player]: AttackedByPlayerEvent,
}

/** @internal */
export function parseEntityEvent(event: ServerEvent): EntityEvent {
  const [entityId, ...extras] = event.extras
  return Object.assign(event, {
    entityId,
    extras,
  })
}

/** @internal */
export function parseAttackedEntityEvent(event: ServerEvent): AttackedEntityEvent {
  const entityEvent = parseEntityEvent(event)
  const [damageSource, attackerType, ...extras] = entityEvent.extras
  const attackedEntityEvent: AttackedEntityEvent = Object.assign(entityEvent, {
    damageSource,
    attackerType,
    extras,
  })
  switch (attackerType) {
    case AttackerType.player: return parseAttackedByPlayerEvent(attackedEntityEvent)
  }
  return attackedEntityEvent
}

/** @internal */
export function parseAttackedByPlayerEvent(event: AttackedEntityEvent): AttackedByPlayerEvent {
  const [attacker, extras] = parsePlayerWithHeldItems(event)
  return Object.assign(event, {
    attacker,
    extras,
  })
}
