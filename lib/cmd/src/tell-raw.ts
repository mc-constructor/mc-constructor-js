import { Command, SimpleVoidCommand } from './command'
import { TextBuilder } from './text'

class TellRawCommand extends SimpleVoidCommand {
  protected readonly command: string = 'tellraw'

  constructor(public readonly target: string, public readonly segments: TextBuilder[]) {
    super()
  }

  protected formatArgs(): string {
    return `${this.target} [${this.segments.join(',')}]`;
  }
}

export function tellraw(target: string, ...segments: TextBuilder[]): Command {
  return new TellRawCommand(target, segments)
}
