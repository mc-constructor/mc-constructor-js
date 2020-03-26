import { Observable, Observer, Subscription } from 'rxjs'
import { ServerChannel, ServerChannelMessage, ServerMessage } from './messages'
import { share } from 'rxjs/operators'

export class MessageStream<TChannel extends ServerChannel> extends Observable<ServerChannelMessage<TChannel>> {
  constructor(channel: TChannel, initFn: (channel: ServerChannel, o: Observer<ServerChannelMessage<TChannel>>) => void) {
    super(o => initFn(channel, o))
  }
}

export type MessageStreamChannels = { [TChannel in ServerChannel]: MessageStream<TChannel> }

export class Director {

  public readonly channels: MessageStreamChannels

  constructor(messages$: Observable<ServerMessage>) {
    const channels = new Map<ServerChannel, Observer<any>>()
    let sub: Subscription

    function checkSub() {
      if (!channels.size) {
        if (sub) {
          sub.unsubscribe()
          sub = undefined
        }
        return
      }

      if (!sub) {
        sub = messages$.subscribe(msg => {
          const channelObs = channels.get(msg.channel)
          if (channelObs) {
            channelObs.next(msg)
          }
        })
      }
    }

    function initChannel(channel: ServerChannel, o: Observer<any>) {
      channels.set(channel, o)
      checkSub()
      return () => {
        channels.delete(channel)
        checkSub()
      }
    }

    this.channels = Object.values(ServerChannel).reduce((result, channel) => {
      result[channel] = new MessageStream(channel, initChannel).pipe(share())
      return result
    }, {}) as MessageStreamChannels
  }
}
