import { Constructor } from '@dandi/common'
import { Injectable, InjectionToken, Multi } from '@dandi/core'
import { isTextComponent, TextComponent } from '@ts-mc/core/cmd'
import { CommandRequest } from '@ts-mc/core/command'
import { Coordinates } from '@ts-mc/core/types'
import { Observable, of } from 'rxjs'
import { filter, take } from 'rxjs/operators'

import { localToken } from '../local-token'
import { MinigameEvents } from '../minigame-events'

import { HookHandler } from './behaviors'

export type ArenaHookEvents<TEvents extends MinigameEvents> = {
  [THook in keyof TEvents]: TEvents[THook] extends Observable<infer TEvent> ? TEvent : never
}
export type ArenaHooks<TEvents extends MinigameEvents> = {
  [THook in keyof ArenaHookEvents<TEvents>]?: HookHandler<ArenaHookEvents<TEvents>[THook]>[]
}

export type ArenaRequirement<TEvents extends MinigameEvents, TArena extends Arena<TEvents> = Arena<TEvents>> =
  (events: TEvents, arena: TArena) => Observable<any>

export interface ArenaDescriptor<TEvents extends MinigameEvents> {
  title: TextComponent
  description: TextComponent
}

export interface Arena<TEvents extends MinigameEvents> {
  readonly hooks?: ArenaHooks<TEvents>
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
  return arena.constructor as unknown as ArenaDescriptor<TEvents>
}

export type NoRequirements = [() => Observable<void>]
export const NoRequirements: NoRequirements = [() => of(undefined)]

export interface ArenaRequirementsStatic<TEvents extends MinigameEvents> {
  none: NoRequirements
  count(hook: keyof TEvents, count: number): ArenaRequirement<TEvents>
  minArenaAge(age: number): ArenaRequirement<TEvents>
  minGameAge(age: number): ArenaRequirement<TEvents>
}

function areValidRequirements(obj: any): obj is ArenaRequirement<MinigameEvents>[] {
  return Array.isArray(obj) && obj.every((req: any) => typeof req === 'function')
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
    Injectable(Arena, Multi)(target)
  }
}

export interface ArenaConfiguration<TEvents extends MinigameEvents> {
  entry: [ArenaRequirement<TEvents>, ...ArenaRequirement<TEvents>[]]
  exit: [ArenaRequirement<TEvents>, ...ArenaRequirement<TEvents>[]]
}

export interface ConfiguredArena<TEvents extends MinigameEvents> {
  instance: Arena<TEvents>
  config: ArenaConfiguration<TEvents>
}
export const ConfiguredArenas: InjectionToken<ConfiguredArena<MinigameEvents>[]> = localToken.opinionated('ConfiguredArenas', {
  multi: false,
})

export const Arena: ArenaDecorator = ArenaDecorator

export function ArenaRequirements<TEvents extends MinigameEvents>(): ArenaRequirementsStatic<TEvents> {
  return {
    none: NoRequirements,
    count: <TEvents extends MinigameEvents>(hook: keyof ArenaHookEvents<TEvents>, count: number): ArenaRequirement<TEvents> =>
      (events: TEvents) => {
        const event$: Observable<any> = events[hook] as any
        return event$.pipe(take(count))
      },
    minArenaAge: <TEvents extends MinigameEvents>(age: number): ArenaRequirement<TEvents> =>
      (events: TEvents, arena: Arena<TEvents>) =>
        events.arenaAge$(arena).pipe(
          filter(event => event.arenaAge >= age),
          take(1),
        ),
    minGameAge: <TEvents extends MinigameEvents>(age: number): ArenaRequirement<TEvents> =>
      (events: TEvents) =>
        events.minigameAge$.pipe(
          filter(event => event.minigameAge >= age),
          take(1),
        ),
  }
}
