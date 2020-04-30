import { Inject, Injectable } from '@dandi/core'

import { ObjectiveDisplay, TextComponent } from '../../cmd'
import { Client } from '../../server'

import { Objective } from './objective'
import { ServerObjective } from './server-objective'

@Injectable()
export class Scoreboard {

  private readonly objectives = new Map<string, ServerObjective>()

  constructor(@Inject(Client) private client: Client) {}

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
