import { Constructor } from '@dandi/common'
import { loggerFactory } from '@ts-mc/common'
import { defer, Observable, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'


export enum ScoreOperation {
  add = 'add',
  set = 'set',
}

export interface ObjectiveEvent {
  objectiveId: string
  operation: ScoreOperation
  player: string
  value: number
}

export class Objective {

  public readonly incrementScore: (player: string, value: number) => void
  public readonly setScore: (player: string, value: number) => void
  public readonly events$: Observable<ObjectiveEvent>

  protected readonly events$$: Subject<ObjectiveEvent> = new Subject<ObjectiveEvent>()

  private readonly scores = new Map<string, number>()
  private readonly logger = loggerFactory.getLogger(this.constructor as Constructor)

  constructor(
    public readonly id: string,
  ) {
    this.incrementScore = this.next.bind(this, this.id, ScoreOperation.add)
    this.setScore = this.next.bind(this, this.id, ScoreOperation.set)
    this.events$ = defer(() => this.init())
  }

  public getScore(player: string): number {
    return this.scores.get(player) || 0
  }

  protected next(objectiveId: string, operation: ScoreOperation, player: string, value: number): void {
    this.events$$.next({
      objectiveId,
      operation,
      player,
      value,
    })
  }

  protected init(): Observable<ObjectiveEvent> {
    return this.events$$.pipe(
      tap(event => {
        let opLog: string
        let score = this.scores.get(event.player) || 0
        const prevScore = score
        switch (event.operation) {
          case ScoreOperation.add:
            opLog = `+ ${event.value} =`
            score += event.value
            break
          case ScoreOperation.set:
            opLog = `set to`
            score = event.value
            break
        }
        this.logger.info(`${event.objectiveId}: ${event.player} ${prevScore} ${opLog} ${score}`)
        this.scores.set(event.player, score)
      })
    )
  }

}
