import { InjectionToken, Module } from '@dandi/core'
import { Command } from '@minecraft/core/cmd'
import { Coordinates } from '@minecraft/core/types'

import { GameScope } from './game-scope'
import { localToken } from './local-token'

export interface Minigame {

  // TODO: move these to decorators?

  readonly init: Command
  validateGameState(): Command
  ready(): Command

}

export const Minigame: InjectionToken<Minigame> = localToken.opinionated<Minigame>('Minigame', {
  multi: false,
  restrictScope: GameScope,
})

export interface MinigameConstructor {
  new (...args: any[]): Minigame
}

export interface MinigameDescriptor {
  readonly version: number
  readonly title: string
  readonly titleMatch: RegExp
  readonly description?: string
  readonly module: Module
  cleanup(): void
}
