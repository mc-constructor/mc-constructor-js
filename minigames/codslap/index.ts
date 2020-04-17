import { MinigameDescriptor } from '@minecraft/minigames'

import { cleanup } from './src/codslap-cleanup'
import { Codslap } from './src/codslap-metadata'
import { CodslapModule } from './src/codslap.module'

const descriptor: MinigameDescriptor = Object.assign(Codslap, {
  cleanup: cleanup,
  module: CodslapModule,
})

export default descriptor
