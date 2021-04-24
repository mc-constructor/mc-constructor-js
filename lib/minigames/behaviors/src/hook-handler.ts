import { CommandRequest } from '@ts-mc/core/command'
import { MinigameEvents } from '@ts-mc/minigames'
import { Coordinates } from '@ts-mc/core/types'
import { Observable } from 'rxjs'

export interface HookHandlerArgs<TEvents extends MinigameEvents> {
  event: any
  events: TEvents
  getRandomSpawn(): Coordinates
}


export interface HookHandler<TEvents extends MinigameEvents> {
  (args: HookHandlerArgs<TEvents>): CommandRequest
  triggerFilter?: () => Observable<boolean>
}
