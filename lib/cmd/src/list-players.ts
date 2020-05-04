import { SimpleArgsCommand } from '../../command'
import { ClientMessageResponse, Player } from '../../client'

type UuidsArgs = ['uuids'] | []
const UUIDS: UuidsArgs = ['uuids']
const NO_UUIDS: UuidsArgs = []

export interface ListPlayersResult {
  connectedPlayers: number
  maxPlayers: number
  players: Player[]
}

class ListPlayersCommand extends SimpleArgsCommand<UuidsArgs, ListPlayersResult> {
  protected readonly command: string = 'list'

  constructor(public readonly uuids: boolean = false) {
    super(...(uuids ? UUIDS : NO_UUIDS))
  }

  protected parseSuccessResponse(response: ClientMessageResponse): ListPlayersResult {
    const [key, connectedRaw, maxRaw, playersRaw] = response.extras
    const connectedPlayers = parseInt(connectedRaw)
    const maxPlayers = parseInt(maxRaw)
    const players = playersRaw.split(', ')
      .filter(player => !!player)
      .map(entry => {
        const [name, uuidRaw] = entry.split(' ')
        const uuid = uuidRaw.substring(1, uuidRaw.length - 1)
        return { name, uuid }
      })
    return {
      connectedPlayers,
      maxPlayers,
      players,
    }
  }

}

export function listPlayers(uuids: boolean = false): ListPlayersCommand {
  return new ListPlayersCommand(uuids)
}
