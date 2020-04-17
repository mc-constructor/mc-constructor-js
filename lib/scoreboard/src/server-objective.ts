import { Disposable } from '@dandi/common'

import {
  addObjective,
  addScore,
  ObjectiveDisplay,
  removeObjectives,
  setObjectiveDisplay,
  setScore,
  TextComponent
} from '../../cmd'
import { parallel } from '../../command'
import { SubscriptionTracker } from '../../common'
import { Client } from '../../server'

import { Objective, ScoreOperation } from './objective'

export class ServerObjective extends Objective implements Disposable {

  public readonly ready: Promise<void> = this.init()

  public constructor(
    private readonly client: Client,
    id: string,
    public readonly displayName?: TextComponent,
    public readonly display?: ObjectiveDisplay,
  ) {
    super(id)
  }

  private async init(): Promise<void> {
    const initCmds = [
      removeObjectives(this.id),
      addObjective(this.id, 'dummy', this.displayName)
    ]
    if (this.display) {
      initCmds.push(setObjectiveDisplay(this.display, this.id))
    }
    await parallel(...initCmds).execute(this.client)

    SubscriptionTracker.instance.track(this, this.subscribe(async event => {
      await this.ready
      switch (event.operation) {
        case ScoreOperation.add: return addScore(event.player, this.id, event.value).execute(this.client)
        case ScoreOperation.set: return setScore(event.player, this.id, event.value).execute(this.client)
      }
    }))
  }

  public dispose(reason: string): void {
    SubscriptionTracker.instance.release(this)
  }

}
