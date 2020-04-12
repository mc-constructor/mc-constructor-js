import { Command, SimpleCommand } from '../../command'

const OBJECTIVES = Symbol.for('mc:objectives')

export class Objective {
  private static readonly [OBJECTIVES]: Map<string, Objective> = new Map<string, Objective>()

  public static for(id: string, criterion: string, displayName?: string): Objective {
    const existing = this[OBJECTIVES].get(id)
    if (existing) {
      return existing
    }
    const objective = new Objective(id, criterion)
    this[OBJECTIVES].set(id, objective)
    return objective
  }

  private _displayName: string
  public get displayName(): string {
    return this._displayName
  }

  public readonly id: string

  private constructor(id: string, public readonly criterion: string, displayName?: string) {
    this.id = `mc_${id}`
    this._displayName = displayName || id
  }

  public async updateDisplayName(client: Rcon, displayName: string): Promise<this> {
    if(await new UpdateObjectiveDisplayNameCommand(this.id, displayName).execute(client)) {
      this._displayName = displayName
    }
    return this
  }

  public async init(client: Rcon): Promise<this> {
    if (!(await new AddObjectiveCommand(this.id, this.criterion, this.displayName))) {
      // TODO: get existing scores
    }
    return this
  }
}

export abstract class ScoreboardCommand<TResponse = void> extends SimpleCommand<TResponse> {
  protected readonly command: string = 'scoreboard'
  protected abstract readonly scoreboardCommand: string

  protected formatArgs(): string {
    return `${this.scoreboardCommand} ${this.formatScoreboardArgs()}`
  }

  protected abstract formatScoreboardArgs(): string

}

export abstract class ObjectivesCommand<TResponse = void> extends ScoreboardCommand<TResponse> {
  protected readonly scoreboardCommand: string = 'objectives'
  protected abstract readonly objectivesCommand: string

  protected formatScoreboardArgs(): string {
    const objArgs = this.formatObjectivesCommandArgs()
    return `${this.objectivesCommand}${objArgs ? ' ' : ''}${objArgs}`
  }

  protected formatObjectivesCommandArgs(): string {
    return ''
  }
}

export class ObjectivesListCommand extends ObjectivesCommand {
  protected readonly objectivesCommand: string = 'list'
}

export abstract class ObjectiveCommand<TResult> extends ObjectivesCommand<TResult> {

  protected constructor(public readonly id: string) {
    super()
  }

  protected formatObjectivesCommandArgs(): string {
    return `${this.id} ${this.formatObjectiveCommandArgs()}`
  }

  protected abstract formatObjectiveCommandArgs(): string
}

export class AddObjectiveCommand extends ObjectiveCommand<boolean> {
  protected readonly objectivesCommand: string = 'add'

  constructor(id: string, public readonly criterion: string, public readonly displayName: string = '') {
    super(id)
  }

  protected formatObjectiveCommandArgs(): string {
    return `${this.criterion} ${this.displayName}`
  }

  protected parseResponse(responseText: string): boolean {
    const expected = `Created new objective [${this.displayName || this.id}]`
    if (responseText === expected) {
      return true
    }
    if (responseText === 'An objective already exists by that name') {
      return false
    }

    throw new Error(`Invalid response: '${responseText}', expected '${expected}'`)
  }
}

export class UpdateObjectiveDisplayNameCommand extends ObjectivesCommand<boolean> {
  protected readonly objectivesCommand: string = 'modify'

  constructor(public readonly id: string, public readonly displayName: string) {
    super()
  }

  protected formatObjectivesCommandArgs(): string {
    return `${this.id} "${this.displayName.replace(/"/g, '\\"')}"`
  }

  protected parseResponse(responseText: string): boolean {
    const expected = `Changed objective ${this.id} display name to [${this.displayName}]`
    if (responseText === expected) {
      return true
    }

    throw new Error(`Invalid response: '${responseText}', expected '${expected}'`)
  }
}

export class Scoreboard {

  private static readonly [OBJECTIVES]: Map<string, Scoreboard> = new Map<string, Scoreboard>()

  private constructor(private readonly client: Rcon, public readonly objective: string) {
  }

  public async ensureObjective(objective: string): Promise<void> {

  }



}
