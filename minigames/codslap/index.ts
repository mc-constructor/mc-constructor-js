import { MinigameDescriptor } from '@minecraft/minigames'

import { cleanup } from './src/codslap'
import { CodslapModule } from './src/codslap.module'

export const Codslap: MinigameDescriptor = {
  version: 3,
  key: 'codslap',
  title: 'CODSLAP!',
  // titleMatch: /codslap/i,
  description: 'Slap your friends with an overpowered cod.',
  cleanup: cleanup,
  module: CodslapModule,
}

export default Codslap
