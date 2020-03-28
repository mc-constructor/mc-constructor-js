import { CodslapMiniGame } from '../../../minigames/codslap'

import { text } from '../../cmd'
import { loc } from '../../types'
import { ServerEvents } from '../../server'

const minigames = [new CodslapMiniGame()]

export const GAMES_COMMANDS = async function (events$: ServerEvents, args: string[]): Promise<any[]> {
  const [subCmd, ...gamesArgs] = args
  switch (subCmd) {
    case 'list': return [
      text(''), // start empty so that the initial formatting properties aren't used for all parts
      text(`\nYou can play these minigames:\n\n`).bold.color('aqua'),
      ...minigames.reduce((result, minigame) => {
        result.push(
          text(`  ${minigame.title} :`).bold.italic,
          text(' ' + minigame.description),
        )
        return result
      }, []),
      text('\n\nChat '),
      text('$games start ').color('light_purple'),
      text('game_name').color('light_purple').italic,
      text(' to start a game'),
    ]

    case 'start': {
      const game = new CodslapMiniGame()
      const validate = game.validateGameState()
      if (validate) {
        await validate.execute(events$.client)
      }
      game.init(loc(0, 100, 0)).execute(events$.client)
      game.ready(events$).execute(events$.client)
      return
    }

    case 'clear': {

    }
  }
}
