import { Uuid } from '@dandi/common'
import { ServerEvent, ServerEventType } from '@ts-mc/core/server-events'

export function serverEventFixture(type: ServerEventType): ServerEvent {
  return {
    messageId: Uuid.create(),
    type,
    extras: [],
  }
}
