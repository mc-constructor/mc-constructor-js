import { filter } from 'rxjs/operators'

import { Client, ServerChannel, ServerEventsChannel, ServerThreadEventType } from '../../server'
import { GAMES_COMMANDS } from './games'

const COMMANDS = {
  games: GAMES_COMMANDS,
}

export class ChatCommands {

  constructor(client: Client, thread$: ServerEventsChannel<ServerChannel.thread>) {
    thread$.eventType(ServerThreadEventType.playerChat)
      .pipe(
        filter(event => event.data.message.startsWith('$'))
      )
      .subscribe(event => {
        const [cmdRaw, ...args] = event.data.message.trim().split(' ')
        const cmd = cmdRaw.toLocaleLowerCase().substring(1)
        // console.log(`sending "${event.data.message}"`)
        // client.send(event.data.message)

        const messageParts = this.handleMessage(client, cmd, args).map(part => JSON.stringify(part)).join(',')
          // TODO: tellraw command tooling
          // https://minecraft.gamepedia.com/Raw_JSON_text_format
        return client.send(`tellraw ${event.data.player} [${messageParts}]`)
      })
  }

  private handleMessage(client: Client, cmd: string, args: any[]): any[] {
    if (COMMANDS[cmd]) {
      return COMMANDS[cmd](client, args)
    }
    return [`I don't know what you're talking about :(`]
  }

}
