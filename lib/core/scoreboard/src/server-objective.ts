import { silence } from '@ts-mc/common/rxjs'
import { combineLatest, EMPTY, Observable } from 'rxjs'
import { mapTo, mergeMap, pluck, share, skip, startWith } from 'rxjs/operators'

import {
  addObjective,
  addScore,
  ObjectiveDisplay,
  removeObjectives,
  setObjectiveDisplay,
  setScore,
  TextComponent
} from '@ts-mc/core/cmd'
import { CommandRequest, parallel } from '@ts-mc/core/command'
import { RequestClient } from '@ts-mc/core/client'

import { Objective, ObjectiveEvent, ScoreOperation } from './objective'

export class ServerObjective extends Objective {

  public constructor(
    private readonly client: RequestClient,
    id: string,
    public readonly displayName?: TextComponent,
    public readonly display?: ObjectiveDisplay,
  ) {
    super(id)
  }

  protected init(): Observable<ObjectiveEvent> {
    const initCmds = [
      removeObjectives(this.id),
      addObjective(this.id, 'dummy', this.displayName),
    ]
    if (this.display) {
      initCmds.push(setObjectiveDisplay(this.display, this.id))
    }

    // objectives need to be added to the server before we can start operating on them
    const initCmd = parallel('serverObjective.initCmds', ...initCmds).execute(this.client)

    return combineLatest([
      // this ensures that we start queueing up events to get handled right away, but don't handle them until all the
      // objectives have been created on the server
      // startWith(undefined) to make sure that the objective init commands are sent right away, without having to wait
      // for an objective event
      super.init().pipe(startWith(undefined as ObjectiveEvent)),
      initCmd.pipe(mapTo(true)),
    ]).pipe(
      skip(1),  // skips the undefined "startWith" event
      pluck(0), // get rid of the dummy "true" value from the init
      mergeMap(event => {
        let cmd: CommandRequest
        switch (event.operation) {
          case ScoreOperation.add:
            cmd = addScore(event.player, this.id, event.value)
            break
          case ScoreOperation.set:
            cmd = setScore(event.player, this.id, event.value)
            break
        }

        if (cmd) {
          // merge with empty observable so that the command executes, but doesn't add its result into the stream
          return cmd.execute(this.client).pipe(silence)
        }
        return EMPTY
      }),
      share(),
    )

  }

}
