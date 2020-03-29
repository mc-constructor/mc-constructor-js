import { merge, Observable } from 'rxjs'
import { filter, map, share } from 'rxjs/operators'

import { Director, MessageStream } from './director'
import { ServerChannel, ServerChannelMessage, ServerMessages } from './messages'
import { Server } from './server'
import {
  CHANNEL_PATTERNS,
  ChannelEvent,
  ChannelEventTypes,
  EventStreamChannels,
  ServerEventPatterns,
  ServerEventsChannel
} from './channels'
import { Client } from './client'
import { Inject, Injectable } from '@dandi/core'

export * from './events/auth'
export * from './events/main'
export * from './events/thread'
export * from './events/unknown'
export * from './events/worker'

export function makeEventStream<
  TChannel extends ServerChannel,
>(
  channel: TChannel,
  patterns: ServerEventPatterns<any>,
  director: Director,
): Observable<ChannelEvent<TChannel>> {
  const channel$ = director.channels[channel] as MessageStream<TChannel>
  return channel$.pipe(
    map((msg: ServerChannelMessage<TChannel>) => {
      for (const [type, pattern] of patterns) {
        const result = Array.isArray(pattern) ?
          pattern.map(p => msg.content.match(p)).find(r => !!r) : // TODO: return after first match instead of iterating everything
          msg.content.match(pattern)
        if (result) {
          const data = Object.assign({}, result.groups) as ChannelEventTypes[TChannel][any]
          const source = msg
          return {
            source,
            type,
            data,
          } as ChannelEvent<TChannel>
        }
      }
      console.warn('[unrecognized]', msg.source.raw);
      return undefined
    }),
    filter(msg => !!msg),
    share(),
  )
}

@Injectable()
export class ServerEvents {

  public readonly all: Observable<ChannelEvent<any>>
  public readonly client: Client

  private readonly _channels: EventStreamChannels

  constructor(
    @Inject(Server) server: Server,
    @Inject(Director) director: Director,
  ) {
    this.client = server

    this._channels = Object
      .entries(CHANNEL_PATTERNS)
      .reduce((result, [ channel, patterns ]) => {
      result[channel] = new ServerEventsChannel(makeEventStream(channel as ServerChannel, patterns, director))
      return result
    }, {}) as EventStreamChannels
    this.all = merge(...Object.values(this._channels))
  }

  public channel<TChannel extends ServerChannel>(channel: TChannel): ServerEventsChannel<TChannel> {
    return this._channels[channel] as ServerEventsChannel<any>
  }
}
