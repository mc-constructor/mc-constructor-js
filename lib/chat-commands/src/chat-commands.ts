import { Inject, Injectable } from '@dandi/core'

import { text, TextBuilder, TextFragmentBuilder } from '../../cmd'
import { ServerEvents } from '../../server'

import { GamesCommands } from './games'

@Injectable()
export class ChatCommands {

  public readonly commands: { [cmd: string]: { exec(args: string[]): Promise<TextBuilder | TextFragmentBuilder> }}

  constructor(
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(GamesCommands) games: GamesCommands,
  ) {
    this.commands = {
      games,
      game: games,
    }
  }

  private async handleMessage(cmd: string, args: any[]): Promise<TextBuilder | TextFragmentBuilder> {
    if (this.commands[cmd]) {
      return await this.commands[cmd].exec(args)
    }
    return text(`I don't know what you're talking about :(`)
  }

}
