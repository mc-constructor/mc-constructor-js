import { CommandRequest, SimpleArgsCommandRequest } from '@ts-mc/core/command'

// https://minecraft.gamepedia.com/Commands/clear

class ClearCommand extends SimpleArgsCommandRequest {
  protected readonly command = 'clear'
  protected readonly allowedErrorKeys: string[] = ['clear.failed.single', 'clear.failed.multiple']

  // TODO: implement the rest of the arguments
  constructor(public readonly target: string) {
    super(target)
  }

}

export function clear(target: string): CommandRequest {
  return new ClearCommand(target)
}
