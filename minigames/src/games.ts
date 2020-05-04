import { Inject, Injectable } from '@dandi/core'
import { text, TextBuilder, TextFragmentBuilder } from '@minecraft/core/cmd'
import { ServerEvents, Players } from '@minecraft/core/client'

import { MinigameLoader } from './minigame-loader'
import { MinigameRunner } from './minigame-runner'

// @Injectable()
// export class GamesCommands {
//
//   constructor(
//     @Inject(MinigameLoader) private loader: MinigameLoader,
//     @Inject(MinigameRunner) private runner: MinigameRunner,
//     @Inject(ServerEvents) private events$: ServerEvents,
//     @Inject(Players) private players$: Players,
//   ) {}
//
//   public async exec(args: string[]): Promise<TextBuilder | TextFragmentBuilder> {
//     const [subCmd, ...gamesArgs] = args
//     switch (subCmd) {
//       case 'list': return this.list()
//       case 'start':
//         const [gameName] = gamesArgs
//         return this.start(gameName)
//     }
//   }
//
//   private list(initial?: TextBuilder | TextFragmentBuilder): TextBuilder | TextFragmentBuilder {
//     const games = this.loader.listGames()
//     initial = initial || text()
//     const result = initial.add(`\n\nYou can play these minigames:\n\n`).bold.color('aqua')
//     games.forEach(minigame => {
//       result.add(`  ${minigame.title} :`).bold.italic
//         .add(' ' + minigame.description)
//     })
//     return result
//       .add('\n\nChat ')
//       .add('$games start ').color('light_purple')
//       .add('game_name').color('light_purple').italic
//       .add(' to start a game')
//   }
//
//   private async start(gameName: string): Promise<TextBuilder | TextFragmentBuilder> {
//     const games = this.loader.listGames()
//     const gameInfo = games.find(game => game.titleMatch.test(gameName))
//     if (!gameInfo) {
//       return this.list(
//         text(`\n\nCould not find a game named ${gameName}`).italic
//       )
//     }
//
//     await this.runner.runGame(this.loader.loadMinigame(gameInfo))
//   }
//
// }
