import { SimpleArgsCommandRequest } from '@ts-mc/core/command'
import { ClientResponse } from '@ts-mc/core/client'
import { Player } from '@ts-mc/core/types'

type UuidsArgs = ['uuids'] | []
const UUIDS: UuidsArgs = ['uuids']
const NO_UUIDS: UuidsArgs = []

export interface ListPlayersResult {
  connectedPlayers: number
  maxPlayers: number
  players: Player[]
}

class ListPlayersCommand extends SimpleArgsCommandRequest<UuidsArgs, ListPlayersResult> {
  protected readonly command: string = 'list'

  constructor(public readonly uuids: boolean = false) {
    super(...(uuids ? UUIDS : NO_UUIDS))
  }

  protected parseSuccessResponse(response: ClientResponse): ListPlayersResult {
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
