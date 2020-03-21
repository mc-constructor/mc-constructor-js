import { Rcon } from 'rcon-client'
import { test } from './lib/routines'
import { run } from './lib/routines'
import { ASCII } from './lib/routines'

require('dotenv').config()

async function main(): Promise<void> {
  const rcon = await Rcon.connect({
    host: process.env.RCON_HOST,
    port: parseInt(process.env.RCON_PORT, 10),
    password: process.env.RCON_PASSWORD,
  })

  const routine = run(rcon, test())
  let cmd = routine.next()
  while(!cmd.done) {
    console.log('\n[send >]', cmd.value.cmd)
    console.log('[send <]', await cmd.value.response)
    cmd = routine.next()
  }
}

// main().catch(console.error.bind(console))

console.log(ASCII)
