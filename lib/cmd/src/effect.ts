import { Command, SimpleArgsCommand } from '../../command'
import { Effect } from '../../types'

export enum EffectSubCommand {
  clear = 'clear',
  give = 'give',
}

class EffectCommand extends SimpleArgsCommand {
  protected readonly command = 'effect'
  protected readonly allowedErrorKeys: string[] = ['commands.effect.clear.everything.failed']

  constructor(
    public readonly subCommand: EffectSubCommand,
    public readonly target: string,
    ...args: any[]
  ) {
    super(subCommand, target, ...args)
  }

}

export function clearEffect(target: string): Command {
  return new EffectCommand(EffectSubCommand.clear, target)
}

export function giveEffect(target: string, effect: Effect, value?: any): Command {
  return new EffectCommand(EffectSubCommand.give, target, effect, value)
}
