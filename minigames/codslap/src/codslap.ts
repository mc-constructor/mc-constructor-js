import { Command, rawCmd, tellraw, text } from '@minecraft/core/cmd'
import { Coordinates } from '@minecraft/core/types'
import { Minigame } from '@minecraft/minigames'

import { CodslapInitCommand } from './init'
import { ServerChannel, ServerEvents, ServerThreadEventType } from '@minecraft/core/server'
import { delay, filter, retryWhen, switchMap, take } from 'rxjs/operators'
import { Subscription } from 'rxjs'
import { fromPromise } from 'rxjs/internal-compatibility'

const subs: Subscription[] = []

export class CodslapMiniGame implements Minigame {

  public readonly title = 'Codslap!'
  public readonly description = 'Slap your friends with an overpowered cod.'

  public validateGameState(): Command {
    return undefined
  }

  public init(loc: Coordinates): Command {
    subs.forEach(sub => sub.unsubscribe())
    subs.length = 0
    return new CodslapInitCommand(loc)
  }

  public ready(event$: ServerEvents): Command {
    const sub = event$
      .channel(ServerChannel.thread)
      .pipe(
        filter(event => event.type === ServerThreadEventType.playerDied || event.type === ServerThreadEventType.playerKilled),
        switchMap(event => {
          const give = rawCmd(`give @p[name=${event.data.player}] cod`, true)
          return fromPromise(give.execute(event$.client))
        }),
        retryWhen(errors => errors.pipe(delay(1000), take(30))),
      )
      .subscribe()
    subs.push(sub)
    return tellraw('@a', text('May the best codslapper win!').bold)
  }

}
