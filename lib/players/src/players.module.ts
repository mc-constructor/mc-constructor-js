import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { Players } from './players'

export class PlayersModuleBuilder extends ModuleBuilder<PlayersModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(PlayersModuleBuilder, localToken.PKG, ...entries)
  }
}

export const PlayersModule = new PlayersModuleBuilder(
  Players,
)
