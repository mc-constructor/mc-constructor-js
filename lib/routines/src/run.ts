import { Rcon } from 'rcon-client'

export interface RunningCommand {
  cmd: string
  response: Promise<string>
}

export function* run(client: Rcon, routine: string[]): Generator<RunningCommand> {
  for (const index in routine) {
    const cmd = routine[index]
    const response = client.send(cmd)
    yield { cmd, response }
  }
}
