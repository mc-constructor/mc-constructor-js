import { SimpleCommandRequest } from '@ts-mc/core/command'

export enum ScoreboardSubCommand {
  objectives = 'objectives',
  players = 'players',
}

export abstract class ScoreboardCommand<TSubCommand extends string, TResponse = void> extends SimpleCommandRequest<TResponse> {
  protected readonly command: string = 'scoreboard'
  protected abstract readonly scoreboardCommand: ScoreboardSubCommand
  protected abstract readonly subCommand: TSubCommand

  protected formatArgs(): string {
    const subArgs = this.formatSubCommandArgs()
    return `${this.scoreboardCommand} ${this.subCommand}${subArgs ? ' ' : ''}${subArgs}`
  }

  protected formatSubCommandArgs(): string {
    return ''
  }

}
