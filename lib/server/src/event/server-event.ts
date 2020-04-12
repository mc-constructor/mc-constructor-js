import { Uuid } from '@dandi/common'

import { ServerEventType } from './server-event-type'

export interface ServerEvent {
  messageId: Uuid
  type: ServerEventType
  extras: string[]
}

export function parseMessage([messageId, [type, ...extras]]): ServerEvent {
  return { messageId, type, extras }
}
