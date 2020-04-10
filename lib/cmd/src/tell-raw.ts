import { Command, SimpleCommand } from './command'
import { TextBuilder, TextFragmentBuilder } from './text'

// https://minecraft.gamepedia.com/Commands/tellraw

class TellRawCommand extends SimpleCommand {
  protected readonly command: string = 'tellraw'
  protected readonly hasResponse = false

  constructor(public readonly target: string, public readonly text: TextBuilder) {
    super()
  }

  protected formatArgs(): string {
    return `${this.target} [${this.text}]`;
  }
}

export function tellraw(target: string, text: TextBuilder | TextFragmentBuilder): Command {
  return new TellRawCommand(target, text.builder)
}
