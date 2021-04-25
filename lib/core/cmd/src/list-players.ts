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
    const [listPlayersKey, connectedRaw, maxRaw, nameAndIdKey, ...playerNameAndUuidPairs] = response.extras
    const connectedPlayers = parseInt(connectedRaw)
    const maxPlayers = parseInt(maxRaw)

    // player names and uuids come in pairs of lines (e.g. player1Name\nplayer1Uuid\nplayer2Name\nplayer2Uuid
    const players = playerNameAndUuidPairs.reduce((result, entry, index) => {
      if (index % 2) {
        return result
      }
      const name = entry
      const uuid = playerNameAndUuidPairs[index + 1]
      result.push({ name, uuid })
      return result;
    }, [])
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
