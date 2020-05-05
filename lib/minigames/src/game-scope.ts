import { CustomInjectionScope } from '@dandi/core'

import { localToken } from './local-token'

export type GameScopeDescription = '@ts-mc/minigames#GameScope'

const GAME_SCOPE: GameScopeDescription =
  `${localToken.PKG}#GameScope` as GameScopeDescription

export interface GameScope extends CustomInjectionScope {
  description: GameScopeDescription
}

export interface GameScopeInstance extends GameScope {
  instanceId: any
}

export const GameScope: GameScope = {
  description: GAME_SCOPE,
  type: Symbol.for(GAME_SCOPE),
}

export function createGameScope(): GameScopeInstance {
  return Object.assign({ instanceId: Math.random() }, GameScope)
}
