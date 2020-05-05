import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'
import { Effect } from '@ts-mc/core/types'

export enum EffectSubCommand {
  clear = 'clear',
  give = 'give',
}

class EffectCommand extends SimpleArgsCommandRequest {
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

export function clearEffect(target: string): CommandRequest {
  return new EffectCommand(EffectSubCommand.clear, target)
}

export function giveEffect(target: string, effect: Effect, value?: any): CommandRequest {
  return new EffectCommand(EffectSubCommand.give, target, effect, value)
}
