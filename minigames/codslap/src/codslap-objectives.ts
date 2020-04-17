import { Disposable } from '@dandi/common'
import { Inject, Injectable, Logger } from '@dandi/core'
import { ObjectiveDisplaySlot, text } from '@minecraft/core/cmd'

import { Objective, Scoreboard } from '../../../lib/scoreboard'

@Injectable()
export class CodslapObjectives implements Disposable {
  public readonly codslap: Objective = this.scoreboard.addObjective('codslap', text('CODSLAP!'), ObjectiveDisplaySlot.belowName)
  public readonly codslapMobKill: Objective = this.scoreboard.addObjective('codslap_m_kill')
  public readonly codslapPlayerKill: Objective = this.scoreboard.addObjective('codslap_p_kill', text('CODSLAP KILL!').bold, ObjectiveDisplaySlot.sidebar)

  constructor(
    @Inject(Scoreboard) private scoreboard: Scoreboard,
    @Inject(Logger) private logger: Logger,
  ) {}

  public dispose(reason: string): void {
    this.logger.info('Removing objectives...')
    this.scoreboard.removeObjectives(this.codslap, this.codslapMobKill, this.codslapPlayerKill)
  }
}
