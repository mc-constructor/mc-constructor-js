import { ChannelEvent } from './channels'
import { ServerChannel } from './messages'

import { ServerThreadEventType } from './events/thread'

export type PlayerEventTypes =
  ServerThreadEventType.playerChat |
  ServerThreadEventType.playerDied |
  ServerThreadEventType.playerEmote |
  ServerThreadEventType.playerGivenItems |
  ServerThreadEventType.playerJoin |
  ServerThreadEventType.playerKilled |
  ServerThreadEventType.playerLeft |
  ServerThreadEventType.playerLogin |
  ServerThreadEventType.playerSlotReplaced

export function isPlayerEvent(event: ChannelEvent<ServerChannel.thread>): event is ChannelEvent<ServerChannel.thread, PlayerEventTypes> {
  // lazy, but it works for now
  return (event?.data as any)?.player
}

export function forPlayer(player: string): (event: ChannelEvent<ServerChannel.thread>) => event is ChannelEvent<ServerChannel.thread, PlayerEventTypes> {
  return (event: ChannelEvent<ServerChannel.thread>): event is ChannelEvent<ServerChannel.thread, PlayerEventTypes> => {
    return isPlayerEvent(event) && event.data.player === player
  }
}
