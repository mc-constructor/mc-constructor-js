import { Command, SimpleArgsCommand } from '../../command'

// https://minecraft.gamepedia.com/Commands/clear

class ClearCommand extends SimpleArgsCommand {
  protected readonly command = 'clear'
  protected readonly allowedErrorKeys: string[] = ['clear.failed.single']

  // TODO: implement the rest of the arguments
  constructor(public readonly target: string) {
    super(target)
  }

}

export function clear(target: string): Command {
  return new ClearCommand(target)
}
