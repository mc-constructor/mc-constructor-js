import { Uuid } from '@dandi/common'

import { ClientMessage } from '../client'

import { ServerEventType } from './server-event-type'

export interface ServerEvent {
  messageId: Uuid
  type: ServerEventType
  extras: string[]
}

export function parseMessage([messageId, [typeRaw, ...extras]]: ClientMessage): ServerEvent {
  const type = typeRaw as ServerEventType
  return { messageId, type, extras }
}
