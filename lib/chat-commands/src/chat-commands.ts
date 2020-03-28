import { filter } from 'rxjs/operators'

import { tellraw, text, TextBuilder } from '../../cmd'
import { Client, ServerChannel, ServerEvents, ServerThreadEventType } from '../../server'

const RELOAD = [
  require.resolve('./games'),
  require.resolve('../../../minigames/index'),
  require.resolve('../../../minigames/codslap/index'),
  require.resolve('../../../minigames/codslap/src/codslap'),
  require.resolve('../../../minigames/codslap/src/init'),
  require.resolve('../../../minigames/test/index'),
]

const COMMANDS = Object.defineProperties({}, {
  games: {
    get: () => {
      RELOAD.forEach(module => delete require.cache[module])
      const GAMES_COMMANDS = require('./games').GAMES_COMMANDS
      return GAMES_COMMANDS
    }
  },
})

export class ChatCommands {

  constructor(events$: ServerEvents) {
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

        const messageParts = await this.handleMessage(events$, cmd, args)
          // TODO: tellraw command tooling
          // https://minecraft.gamepedia.com/Raw_JSON_text_format
        if (messageParts) {
          return tellraw(event.data.player, ...messageParts).execute(events$.client)
        }
      })
  }

  private async handleMessage(event$: ServerEvents, cmd: string, args: any[]): Promise<TextBuilder[]> {
    if (COMMANDS[cmd]) {
      return await COMMANDS[cmd](event$, args)
    }
    return [text(`I don't know what you're talking about :(`)]
  }

}
