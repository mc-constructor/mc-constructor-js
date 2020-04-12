import { Command } from '../../command'
import { TextBuilder, TextCommand, TextFragmentBuilder } from './text'

// https://minecraft.gamepedia.com/Commands/tellraw

class TellRawCommand extends TextCommand {
  protected readonly command: string = 'tellraw'
  protected readonly hasResponse = false
}

export function tellraw(target: string, text: TextBuilder | TextFragmentBuilder): Command {
  return new TellRawCommand(target, text.builder)
}
