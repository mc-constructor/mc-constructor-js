
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

}
