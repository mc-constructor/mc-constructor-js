import { Command } from '../../../command'
import { ScoreboardCommand, ScoreboardSubCommand } from './scoreboard'

enum PlayersSubCommand {
  add = 'add',
  list = 'list',
}

abstract class ScoreboardPlayersCommand extends ScoreboardCommand<PlayersSubCommand> {
  protected readonly scoreboardCommand = ScoreboardSubCommand.players
}

class ScoreboardPlayerListCommand extends ScoreboardPlayersCommand {
  protected readonly subCommand = PlayersSubCommand.list

  constructor(public readonly target?: string) {
    super()
  }

  protected formatSubCommandArgs(): string {
    if (this.target) {
      return this.target
    }
    return ''
  }

}

class ScoreboardAddPlayerScoreCommand extends ScoreboardPlayersCommand {
  protected readonly subCommand = PlayersSubCommand.add

  constructor(
    public readonly target: string,
    public readonly objectiveId: string,
    public readonly value: number,
  ) {
    super()
  }

  protected formatSubCommandArgs(): string {
    return [this.target, this.objectiveId, this.value].join(' ')
  }
}

export function listScoreboardPlayers(): Command {
  return new ScoreboardPlayerListCommand()
}

export function listPlayerScores(target: string): Command {
  return new ScoreboardPlayerListCommand(target)
}

/**
 * @deprecated Currently broken, tracked by https://bugs.mojang.com/browse/MC-136858
 */
export function listAllPlayerScores(): Command {
  return new ScoreboardPlayerListCommand('*')
}

export function addScore(target: string, objectiveId: string, value: number): Command {
  return new ScoreboardAddPlayerScoreCommand(target, objectiveId, value)
}
