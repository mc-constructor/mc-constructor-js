import { Command, rawCmd, tellraw, text } from '@minecraft/core/cmd'
import { Coordinates, Item } from '@minecraft/core/types'
import { Minigame } from '@minecraft/minigames'

import { CodslapInitCommand } from './init'
import { ServerChannel, ServerEvents, ServerThreadEventType } from '@minecraft/core/server'
import { catchError, delay, filter, retryWhen, switchMap, take, tap } from 'rxjs/operators'
import { Observable, Subscription, throwError } from 'rxjs'
import { give } from '@minecraft/core/cmd/src/give'

const subs: Subscription[] = []

export class CodslapMiniGame implements Minigame {

  public readonly title = 'Codslap!'
  public readonly description = 'Slap your friends with an overpowered cod.'

  public static cleanup(): void {
    subs.forEach(sub => sub.unsubscribe())
    subs.length = 0
  }

  public validateGameState(): Command {
    return undefined
  }

  public init(loc: Coordinates): Command {
    return new CodslapInitCommand(loc)
  }

  public ready(event$: ServerEvents): Command {
    const sub = event$
      .channel(ServerChannel.thread)
      .pipe(
        filter(event => event.type === ServerThreadEventType.playerDied || event.type === ServerThreadEventType.playerKilled),
        switchMap(event => {
          const cmd = give(`@e[type=player,name=${event.data.player}]`, Item.cod)
          const cmd$ = new Observable(o => {
            cmd.execute(event$.client).then(result => {
              o.next(result)
              o.complete()
            }, err => o.error(err))
          })
          return cmd$.pipe(
            retryWhen(errors => errors.pipe(
              tap(() => console.log('before retry')),
              delay(2000),
              tap(() => console.log('retrying in 2s')),
            )),
          )
        }),
      )
      .subscribe()
    subs.push(sub)
    return tellraw('@a', text('May the best codslapper win!').bold)
  }

}
