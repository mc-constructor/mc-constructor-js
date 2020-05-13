import { Inject, Injectable } from '@dandi/core'
import { Observable, Observer, Subject, Subscriber, Subscription } from 'rxjs'
import { share } from 'rxjs/operators'

import { ObjectiveDisplay, TextComponent } from '../../cmd'
import { RequestClient } from '@ts-mc/core/client'

import { Objective, ObjectiveEvent } from './objective'
import { ServerObjective } from './server-objective'

// TODO: figure out if this would actually work with tests
class ScoreboardEvents extends Observable<ServerObjective> {

  private observer: Observer<ServerObjective>

  constructor() {
    super((subscriber => {

    }))
  }

}

@Injectable()
export class Scoreboard {

  private readonly objectives = new Map<string, ServerObjective>()
  private readonly objective$$: Subject<ObjectiveEvent>

  public readonly objective$: Observable<ObjectiveEvent>

  constructor(@Inject(RequestClient) private client: RequestClient) {
    this.objective$ = new Observable<ObjectiveEvent>(o => {
      const subscriber = new Subscription()
      const sub = this.objective$$.subscribe(o)
      return () => {

      }
    }).pipe(share())
  }

  public addObjective(id: string, displayName?: TextComponent, display?: ObjectiveDisplay): Objective {
    if (this.objectives.has(id)) {
      throw new Error(`An objective with id '${id}' has already been registered`)
    }

    const obj = new ServerObjective(this.client, id, displayName, display)
    this.objectives.set(id, obj)

    return obj
  }

  public removeObjectives(...objs: Objective[]): void {
    objs.forEach(obj => {
      const serverObj = this.objectives.get(obj.id)
      if (serverObj) {
        this.objectives.delete(obj.id)
      }
    })
  }

}
