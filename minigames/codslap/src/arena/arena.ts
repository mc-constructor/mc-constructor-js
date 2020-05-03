import { Constructor } from '@dandi/common'
import { Injectable, InjectionToken, Multi } from '@dandi/core'
import { isTextComponent, TextComponent } from '@minecraft/core/cmd'
import { Command } from '@minecraft/core/command'
import { Coordinates } from '@minecraft/core/types'
import { Observable, of } from 'rxjs'
import { filter, take } from 'rxjs/operators'

import { HookHandler } from '../hooks'
import { CodslapEvents } from '../codslap-events'
import { localToken } from './local-token'

export type ArenaHookEvents = { [THook in keyof CodslapEvents]: CodslapEvents[THook] extends Observable<infer TEvent> ? TEvent : never }
export type ArenaHooks = { [THook in keyof ArenaHookEvents]?: HookHandler<ArenaHookEvents[THook]>[] }

export type ArenaRequirement<TArena extends Arena = Arena> = (events: CodslapEvents, arena: TArena) => Observable<any>

export interface ArenaDescriptor {
  title: TextComponent
  description: TextComponent
  entryRequirements: ArenaRequirement[]
  exitRequirements: ArenaRequirement[]
}

export interface Arena {
  readonly hooks?: ArenaHooks

  init(): Command
  cleanup(): Command

  getRandomSpawn(): Coordinates
}

export type ArenaConstructor<TArena extends Arena = Arena> = Constructor<TArena> & ArenaDescriptor

export interface ArenaDecorator {
  (): ClassDecorator
}

export function arenaDescriptor(arena: Arena | ConfiguredArena): ArenaDescriptor {
  return arena.constructor as unknown as ArenaDescriptor
}

export type NoRequirements = [() => Observable<void>]
export const NoRequirements: NoRequirements = [() => of(undefined)]

export interface ArenaRequirementsStatic {
  none: NoRequirements
  count(hook: keyof CodslapEvents, count: number): ArenaRequirement
  minArenaAge(age: number): ArenaRequirement
  minGameAge(age: number): ArenaRequirement
}

export interface ArenaStatic extends ArenaDecorator {
  requirements: ArenaRequirementsStatic
}

function areValidRequirements(obj: any): obj is ArenaRequirement[] {
  return Array.isArray(obj) && obj.every((req: any) => typeof req === 'function')
}

function isArenaDescriptor(obj: any): obj is ArenaDescriptor {
  return obj &&
    isTextComponent(obj.title) &&
    isTextComponent(obj.description) &&

    areValidRequirements(obj.entryRequirements) &&
    areValidRequirements(obj.exitRequirements)
}

function ArenaDecorator(): ClassDecorator {
  return function arenaDecorator(target: Function): void {
    if (!isArenaDescriptor(target)) {
      throw new Error(`${target.name} must statically implement ArenaDescriptor`)
    }
    Injectable(Arena, Multi)(target)
  }
}

export interface ArenaConfiguration {
  entry: [ArenaRequirement, ...ArenaRequirement[]]
  exit: [ArenaRequirement, ...ArenaRequirement[]]
}

export interface ConfiguredArena {
  instance: Arena
  config: ArenaConfiguration
}
export const ConfiguredArenas: InjectionToken<ConfiguredArena[]> = localToken.opinionated('ConfiguredArenas', {
  multi: false,
})

export const Arena: ArenaStatic = Object.assign(ArenaDecorator, {
  requirements: {
    none: NoRequirements,
    count: (hook: keyof CodslapEvents, count: number): ArenaRequirement =>
      (events: CodslapEvents) =>
        (events[hook] as Observable<any>).pipe(take(count)),
    minArenaAge: (age: number): ArenaRequirement =>
      (events: CodslapEvents) =>
        events.age$.pipe(
          filter(event => event.arenaAge >= age),
          take(1),
        ),
    minGameAge: (age: number): ArenaRequirement =>
      (events: CodslapEvents) =>
        events.minigameAge$.pipe(
          filter(event => event.minigameAge >= age),
          take(1),
        ),
  },
})
