import { AnyEntity, entityTypeFromEntityId, PlayerWithHeldItems } from '@ts-mc/core/types'

import { parsePlayerWithHeldItems } from './player'
import { ServerEvent } from './server-event'

export interface EntityEvent<TEntity extends AnyEntity = AnyEntity> extends ServerEvent {
  entityId: string
  entityType: TEntity
}

export enum AttackerType {
  player = 'player',
}

export interface AttackedEntityEvent<TEntity extends AnyEntity = AnyEntity> extends EntityEvent<TEntity> {
  damageSource: string
  attackerType: AttackerType | string
}

export interface AttackedByPlayerEvent<TEntity extends AnyEntity = AnyEntity> extends AttackedEntityEvent<TEntity> {
  attacker: PlayerWithHeldItems
}

/** @internal */
export type AttackedByEntityEventType = {
  [AttackerType.player]: AttackedByPlayerEvent<AnyEntity>,
}

/** @internal */
export function parseEntityEvent(event: ServerEvent): EntityEvent<AnyEntity> {
  const [entityId, ...extras] = event.extras
  const entityType = entityTypeFromEntityId(entityId)
  return Object.assign(event, {
    entityId,
    entityType,
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
export function parseAttackedByPlayerEvent<TEntity extends AnyEntity = AnyEntity>(event: AttackedEntityEvent<TEntity>): AttackedByPlayerEvent<TEntity> {
  const [attacker, extras] = parsePlayerWithHeldItems(event)
  return Object.assign(event, {
    attacker,
    extras,
  })
}
