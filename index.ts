import { ChatCommands } from './lib/chat-commands'
import { Players, ServerEvents } from './lib/server'
// import { ASCII } from './lib/routines'

require('dotenv').config()

const events$ = new ServerEvents()
const players$ = new Players(events$)

events$.all.subscribe(console.log.bind(console))
players$.subscribe(console.log.bind(console, 'PLAYERS'))
new ChatCommands(events$)
