import { Inject, Injectable } from '@dandi/core'

import { filter } from 'rxjs/operators'

import { tellraw, text, TextBuilder, TextFragmentBuilder } from '../../cmd'
import { ServerChannel, ServerEvents, ServerThreadEventType } from '../../server'

import { GamesCommands } from './games'

@Injectable()
export class ChatCommands {

  private readonly commands: { [cmd: string]: { exec(args: string[]): Promise<TextBuilder | TextFragmentBuilder> }}

  constructor(
    @Inject(ServerEvents) events$: ServerEvents,
    @Inject(GamesCommands) games: GamesCommands,
  ) {
    const thread$ = events$.channel(ServerChannel.thread)
    thread$.eventType(ServerThreadEventType.playerChat)
      .pipe(
        filter(event => event.data.message.startsWith('$'))
      )
      .subscribe(async event => {
        const [cmdRaw, ...args] = event.data.message.trim().split(' ')
        const cmd = cmdRaw.toLocaleLowerCase().substring(1)
        // console.log(`sending "${event.data.message}"`)
        // client.send(event.data.message)

        const responseMessage = await this.handleMessage(cmd, args)
          // TODO: tellraw command tooling
          // https://minecraft.gamepedia.com/Raw_JSON_text_format
        if (responseMessage) {
          return tellraw(event.data.player, responseMessage).execute(events$.client)
        }
      })
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
