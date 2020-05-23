import { Constructor } from '@dandi/common'
import { Injectable, InjectionToken, Module } from '@dandi/core'
import { Observable } from 'rxjs'

import { GameScope } from './game-scope'
import { localToken } from './local-token'

const MINIGAME_META = Symbol.for('@ts-mc/minigame#meta')

export interface Minigame {
  run$: Observable<any>
}

const MinigameToken: InjectionToken<Minigame> = localToken.opinionated<Minigame>('Minigame', {
  multi: false,
  restrictScope: GameScope,
})

export interface MinigameConstructor {
  new (...args: any[]): Minigame
}

export interface MinigameMetadata {
  readonly key: string
  readonly version: number
  readonly title: string
  readonly description?: string

}

export interface MinigameDescriptor extends MinigameMetadata {
  readonly module: Module
  cleanup(): void
}

export function getMinigameMeta(target: Constructor<Minigame>): MinigameMetadata {
  return Reflect.get(target, MINIGAME_META)
}

function MinigameDecorator(descriptor: MinigameMetadata): ClassDecorator {
  return function minigameDecorator(target) {
    Injectable(MinigameDecorator)(target)
    Reflect.set(target, MINIGAME_META, descriptor)
  }
}

export type MinigameDecorator = (descriptor: MinigameMetadata) => ClassDecorator

export const Minigame: MinigameDecorator = Object.assign(MinigameDecorator, MinigameToken)
