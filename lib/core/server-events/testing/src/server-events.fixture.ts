import { ServerEvent, ServerEvents, ServerEventType, ServerEventTypes } from '@ts-mc/core/server-events'
import { NEVER, Observable } from 'rxjs'

export function serverEventsFixture(events$: Observable<ServerEvent>): ServerEvents {
  return {
    run$: NEVER,
    eventStream<TEvent extends ServerEventType>(type: TEvent): Observable<ServerEventTypes[TEvent]> {
      return events$ as unknown as Observable<ServerEventTypes[TEvent]>
    }
  }
}
