import { ServerEvent } from './server-event'

export interface MinigameEvent extends ServerEvent {
  key: string
  minigameEventType: MinigameEventType
}

export enum MinigameEventType {
  start = 'event.minigame.start',
  stop = 'event.minigame.stop',
  reset = 'event.minigame.reset',
}

export interface MinigameStartEvent extends MinigameEvent {
  minigameEventType: MinigameEventType.start
}

/** @internal */
export function parseMinigameEvent(event: ServerEvent): MinigameEvent {
  const [minigameEventTypeRaw, key, ...extras] = event.extras
  const minigameEventType = minigameEventTypeRaw as MinigameEventType

  return Object.assign(event, {
    key,
    minigameEventType,
    extras,
  })
}

export function parseMinigameStartEvent(event: ServerEvent): MinigameStartEvent {
  return parseMinigameEvent(event) as MinigameStartEvent
}
