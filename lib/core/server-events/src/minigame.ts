import { ServerEvent } from './server-event'

export interface MinigameLifecycleEvent extends ServerEvent {
  key: string
  minigameEventType: MinigameLifecycleEventType
}

export enum MinigameLifecycleEventType {
  start = 'event.minigame.start',
  stop = 'event.minigame.stop',
  reset = 'event.minigame.reset',
}

export interface MinigameStartEvent extends MinigameLifecycleEvent {
  minigameEventType: MinigameLifecycleEventType.start
}

export interface MinigameStopEvent extends MinigameLifecycleEvent {
  minigameEventType: MinigameLifecycleEventType.stop
}

export interface MinigameResetEvent extends MinigameLifecycleEvent {
  minigameEventType: MinigameLifecycleEventType.reset
}

/** @internal */
export function parseMinigameEvent<TEvent extends MinigameLifecycleEvent>(event: ServerEvent): TEvent {
  const [minigameEventTypeRaw, key, ...extras] = event.extras
  const minigameEventType = minigameEventTypeRaw as MinigameLifecycleEventType

  return Object.assign(event, {
    key,
    minigameEventType,
    extras,
  }) as TEvent
}
