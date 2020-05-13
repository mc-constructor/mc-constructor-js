import { CommandRequest } from '@ts-mc/core/command'

import { text, TextBuilder, TextCommand, TextFragmentBuilder } from './text'

// https://minecraft.gamepedia.com/Commands/tellraw

class TellRawCommand extends TextCommand {
  protected readonly command: string = 'tellraw'
  protected readonly hasResponse = false
}

export function tellraw(target: string, message: string | TextBuilder | TextFragmentBuilder): CommandRequest {
  if (typeof message === 'string') {
    message = text(message)
  }
  return new TellRawCommand(target, message.builder)
}
