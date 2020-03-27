import { ServerChannel, ServerChannelMessage } from './messages'
import {
  SERVER_AUTHENTICATOR_PATTERNS,
  ServerAuthenticatorEventDataTypes,
  ServerAuthenticatorEventType
} from './events/auth'
import { SERVER_MAIN_PATTERNS, ServerMainEventDataTypes, ServerMainEventType } from './events/main'
import { SERVER_THREAD_PATTERNS, ServerThreadEventDataTypes, ServerThreadEventType } from './events/thread'
import { SERVER_UNKNOWN_PATTERNS, ServerUnknownEventDataTypes, ServerUnknownEventType } from './events/unknown'
import { SERVER_WORKER_PATTERNS, ServerWorkerEventDataTypes, ServerWorkerEventType } from './events/worker'

import { Observable } from 'rxjs'
import { filter, share } from 'rxjs/operators'

export type ChannelEventTypeMap = {
  [ServerChannel.authenticator]: ServerAuthenticatorEventType,
  [ServerChannel.main]: ServerMainEventType,
  [ServerChannel.thread]: ServerThreadEventType,
  [ServerChannel.unknown]: ServerUnknownEventType,
  [ServerChannel.worker]: ServerWorkerEventType,
}

export type ChannelEventDataTypeMap = {
  [ServerChannel.authenticator]: ServerAuthenticatorEventDataTypes,
  [ServerChannel.main]: ServerMainEventDataTypes,
  [ServerChannel.thread]: ServerThreadEventDataTypes,
  [ServerChannel.unknown]: ServerUnknownEventDataTypes,
  [ServerChannel.worker]: ServerWorkerEventDataTypes,
}

export type ChannelEventTypes = {
  [TChannel in keyof ChannelEventTypeMap]: {
    [TEvent in keyof ChannelEventDataTypeMap[TChannel]]: ChannelEventDataTypeMap[TChannel][TEvent]
  }
}

export type TypeMap<TEventTypeEnum extends string> = {
  [TEventType in TEventTypeEnum]: any
}

export type ServerEventDataTypes<TEventTypeEnum extends string, TTypeMap extends TypeMap<TEventTypeEnum>> = {
  [TEventType in TEventTypeEnum]: TTypeMap[TEventType]
}

// type ChannelEventTypesKeyof<TChannel extends ServerChannel> = keyof ChannelEventTypes[TChannel]

// const EventTypeTest: ChannelEventTypes[ServerChannel.authenticator] = ServerAuthenticatorEventType.playerLoggedIn

// let event: ChannelEvent<ServerChannel.authenticator, ServerAuthenticatorEventType.playerLoggedIn, PlayerAuthenticationEventData>

export interface ChannelEvent<
  TChannel extends ServerChannel,
  TEventType extends keyof ChannelEventTypes[TChannel] = keyof ChannelEventTypes[TChannel],
  TDataType extends ChannelEventTypes[TChannel][TEventType] = ChannelEventTypes[TChannel][TEventType]> {
  source: ServerChannelMessage<TChannel>
  type: TEventType
  data: TDataType
}

export type ServerEventPattern<TChannel extends ServerChannel> = [keyof ChannelEventTypes[TChannel], RegExp]
export type ServerEventPatterns<TChannel extends ServerChannel> = ServerEventPattern<TChannel>[]

export type EventStreamChannels = { [TChannel in ServerChannel]: ServerEventsChannel<TChannel> }

export type ChannelPatterns = { [TChannel in ServerChannel]?: ServerEventPatterns<TChannel> }

export const CHANNEL_PATTERNS: ChannelPatterns = {
  [ServerChannel.authenticator]: SERVER_AUTHENTICATOR_PATTERNS,
  [ServerChannel.main]: SERVER_MAIN_PATTERNS,
  [ServerChannel.thread]: SERVER_THREAD_PATTERNS,
  [ServerChannel.unknown]: SERVER_UNKNOWN_PATTERNS,
  [ServerChannel.worker]: SERVER_WORKER_PATTERNS,
}

class ServerEventsChannelTypeMap<TChannel extends ServerChannel> extends
  Map<keyof ChannelEventTypes[TChannel], Observable<ChannelEvent<TChannel>>> {}

export class ServerEventsChannel<TChannel extends ServerChannel> extends Observable<ChannelEvent<TChannel>> {

  private byType: ServerEventsChannelTypeMap<TChannel> = new ServerEventsChannelTypeMap()

  constructor(channelEvents$: Observable<ChannelEvent<TChannel>>) {
    super(channelEvents$.subscribe.bind(channelEvents$))
  }

  public eventType<TEventType extends keyof ChannelEventTypes[TChannel]>(
    type: TEventType,
  ): Observable<ChannelEvent<TChannel, TEventType>> {
    const existing = this.byType.get(type)
    if (existing) {
      return existing as Observable<ChannelEvent<TChannel, TEventType>>
    }
    const byType = this.pipe(
      filter(event => event.type === type),
      share(),
    ) as Observable<ChannelEvent<TChannel, TEventType>>
    this.byType.set(type, byType)
    return byType
  }

}
