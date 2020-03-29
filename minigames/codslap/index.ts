import { MinigameDescriptor } from '@minecraft/minigames'

import { CodslapMiniGame } from './src/codslap'
import { CodslapModule } from './src/codslap.module'

export const Minigame: MinigameDescriptor = {
  version: 3,
  title: 'CODSLAP!',
  titleMatch: /codslap/i,
  description: 'Slap your friends with an overpowered cod.',
  cleanup: CodslapMiniGame.cleanup,
  module: CodslapModule,
}
