import { CodslapMiniGame } from '../../../minigames/codslap'
import { loc } from '../../types'
import { Client } from '../../server'

const minigames = ['codslap']

export const GAMES_COMMANDS = function (client: Client, args: string[]): any[] {
  const [subCmd, ...gamesArgs] = args
  switch (subCmd) {
    case 'list': return [
      '', // start empty so that the initial formatting properties aren't used for all parts
      {
        text: `\nYou can play these minigames:\n\n`,
        bold: true,
      },
      {
        text: `  ${minigames.join('\n  ')}\n\nChat `,
      },
      {
        text: '$game start ',
        color: 'light_purple',
      },
      {
        text: 'game_name',
        color: 'light_purple',
        italic: true,
      },
      {
        text: ' to start a game.',
        color: 'white',
      },
    ]

    case 'start': {
      const game = new CodslapMiniGame()
      game.init(loc(0, 100, 0)).execute(client)
      return ['May the best slapper win']
    }
  }
}
