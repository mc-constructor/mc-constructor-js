import { Command, SimpleArgsCommand } from '../../command'

class KillCommand extends SimpleArgsCommand {
  protected readonly command = 'kill'
  protected readonly allowedErrorKeys: string[]

  constructor(public readonly target: string, public readonly requireMatch: boolean) {
    super(target)

    if (!requireMatch) {
      this.allowedErrorKeys = ['argument.entity.notfound.entity']
    }
  }

}

export function kill(target: string, requireMatch: boolean = false): Command {
  return new KillCommand(target, requireMatch)
}
