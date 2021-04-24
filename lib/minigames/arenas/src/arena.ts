import { Constructor } from '@dandi/common'
import { Injectable, InjectionToken, Multi, RestrictScope } from '@dandi/core'
import { isTextComponent, TextComponent } from '@ts-mc/core/cmd'
import { CommandRequest } from '@ts-mc/core/command'
import { Coordinates } from '@ts-mc/core/types'
import { GameScope, MinigameEvents } from '@ts-mc/minigames'

import { Hooks } from '../../behaviors/src/hooks'
import { ArenaRequirement } from './arena-requirement'
import { localToken } from './local-token'

export interface ArenaDescriptor<TEvents extends MinigameEvents> {
  title: TextComponent
  description: TextComponent
}

export interface Arena<TEvents extends MinigameEvents> {
  readonly hooks?: Hooks<TEvents>
  readonly entryRequirements?: ArenaRequirement<TEvents>[]
  readonly exitRequirements?: ArenaRequirement<TEvents>[]

  init(): CommandRequest
  cleanup(): CommandRequest

  getRandomSpawn(): Coordinates
}

export type ArenaConstructor<TEvents extends MinigameEvents, TArena extends Arena<TEvents> = Arena<TEvents>> =
  Constructor<TArena> & ArenaDescriptor<TEvents>

export interface ArenaDecorator {
  (): ClassDecorator
}

export function arenaDescriptor<TEvents extends MinigameEvents>(arena: Arena<TEvents> | ConfiguredArena<TEvents>): ArenaDescriptor<TEvents> {
  if (isConfiguredArena(arena)) {
    return arenaDescriptor(arena.instance)
  }
  return arena.constructor as unknown as ArenaDescriptor<TEvents>
}

function isArenaDescriptor(obj: any): obj is ArenaDescriptor<MinigameEvents> {
  return obj &&
    isTextComponent(obj.title) &&
    isTextComponent(obj.description)
}

function ArenaDecorator(): ClassDecorator {
  return function arenaDecorator(target: Function): void {
    if (!isArenaDescriptor(target)) {
      throw new Error(`${target.name} must statically implement ArenaDescriptor`)
    }
    Injectable(Arena, Multi, RestrictScope(GameScope))(target)
  }
}

export interface ArenaConfiguration<TEvents extends MinigameEvents> {
  entry: [ArenaRequirement<TEvents>, ...ArenaRequirement<TEvents>[]]
  exit: [ArenaRequirement<TEvents>, ...ArenaRequirement<TEvents>[]]
}

export interface ConfiguredArena<TEvents extends MinigameEvents> extends ArenaDescriptor<TEvents> {
  config: ArenaConfiguration<TEvents>
  instance: Arena<TEvents>
}

export function isConfiguredArena(obj: any): obj is ConfiguredArena<any> {
  return obj && typeof obj.instance === 'object'
}

export const ConfiguredArenas: InjectionToken<ConfiguredArena<MinigameEvents>[]> = localToken.opinionated('ConfiguredArenas', {
  multi: false,
  restrictScope: GameScope,
})

export const Arena: ArenaDecorator = ArenaDecorator
