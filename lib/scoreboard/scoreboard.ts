

export class Scoreboard {

  private static readonly [OBJECTIVES]: Map<string, Scoreboard> = new Map<string, Scoreboard>()

  private constructor(private readonly client: Rcon, public readonly objective: string) {
  }

  public async ensureObjective(objective: string): Promise<void> {

  }



}
