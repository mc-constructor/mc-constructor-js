import { Constructor } from '@dandi/common'
import { Injectable, InjectionToken, Module } from '@dandi/core'
import { Command } from '@minecraft/core/command'

import { GameScope } from './game-scope'
import { localToken } from './local-token'

const MINIGAME_META = Symbol.for('@minecraft/minigame#meta')

export interface Minigame {

  // TODO: move these to decorators?

  readonly init: Command
  validateGameState(): Command
  ready(): Command

}

const MinigameToken: InjectionToken<Minigame> = localToken.opinionated<Minigame>('Minigame', {
  multi: false,
  restrictScope: GameScope,
})

export interface MinigameConstructor {
  new (...args: any[]): Minigame
}

export interface MinigameDescriptor {
  readonly key: string
  readonly version: number
  readonly title: string
  readonly description?: string
  readonly module: Module
  cleanup(): void
}

export function getMinigameMeta(target: Constructor<Minigame>): MinigameDescriptor {
  return Reflect.get(target, MINIGAME_META)
}

function MinigameDecorator(descriptor: MinigameDescriptor): ClassDecorator {
  return function minigameDecorator(target) {
    Injectable(MinigameDecorator)(target)
    Reflect.set(target, MINIGAME_META, descriptor)
  }
}

export type MinigameDecorator = (descriptor: MinigameDescriptor) => ClassDecorator

export const Minigame: MinigameDecorator = Object.assign(MinigameDecorator, MinigameToken)
