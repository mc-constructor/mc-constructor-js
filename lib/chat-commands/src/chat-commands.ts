import { ServerEventsChannel } from '../../server/src/channels'
import { ServerChannel } from '../../server/src/messages'
import { ServerThreadEventType } from '../../server/src/events/thread'
import { Client } from '../../server/src/client'
import { filter } from 'rxjs/operators'

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

        if (cmd === 'games') {
          const [subCmd, ...gamesArgs] = args
          switch (subCmd) {
            case 'list': return client.send(`tellraw ${event.data.player}`)
          }
        }
      })
  }

}
