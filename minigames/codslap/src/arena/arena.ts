import { Constructor, Disposable } from '@dandi/common'
import { Injectable, Multi } from '@dandi/core'
import { isTextComponent, TextComponent } from '@minecraft/core/cmd'
import { Command } from '@minecraft/core/command'
import { Coordinates } from '@minecraft/core/types'
import { Observable, of } from 'rxjs'
import { filter, take } from 'rxjs/operators'

import { HookHandler } from '../behaviors/hook-handler'
import { CodslapEvents } from '../codslap-events'

export type ArenaHookEvents = { [THook in keyof CodslapEvents]: CodslapEvents[THook] extends Observable<infer TEvent> ? TEvent : never }
export type ArenaHooks = { [THook in keyof ArenaHookEvents]?: HookHandler<ArenaHookEvents[THook]>[] }

export type ArenaRequirement = (events$: CodslapEvents) => Observable<any>

export interface ArenaDescriptor {
  title: TextComponent
  description: TextComponent
  entryRequirements: ArenaRequirement[]
  exitRequirements: ArenaRequirement[]
  minAge: number
}

export interface Arena extends Disposable {

  readonly hooks?: ArenaHooks

  init(): Command
  cleanup(): Command

  getRandomSpawn(): Coordinates
}

export interface ArenaDecorator {
  (): ClassDecorator
}

export type NoRequirements = [() => Observable<any>]

export interface ArenaRequirementsStatic {
  none: NoRequirements
  minAge(age: number): ArenaRequirement
}

export interface ArenaStatic extends ArenaDecorator {
  requirements: ArenaRequirementsStatic
}

function isArenaDescriptor(obj: any): obj is ArenaDescriptor {
  return obj &&
    isTextComponent(obj.title) &&
    isTextComponent(obj.description) &&
    Array.isArray(obj.requirements) &&
    obj.requirements.length &&
    obj.requirements.every(req => typeof req === 'function')
}

function ArenaDecorator(): ClassDecorator {
  return function arenaDecorator(target: Function): void {
    if (!isArenaDescriptor(target)) {
      throw new Error(`${target.name} must statically implement ArenaDescriptor, and both the entryRequirements and ` +
        ' exitRequirements arrays must each contain at least one entry. Use Arena.requirements.none if there are no ' +
        ' requirements')
    }
    Injectable(Arena, Multi)(target)
  }
}

export const Arena: ArenaStatic = Object.assign(ArenaDecorator, {
  requirements: {
    none: [() => of(undefined)] as NoRequirements,
    minAge: (age: number) =>
      (events$: CodslapEvents) =>
        events$.age$.pipe(
          filter(event => event.arenaAge >= age),
          take(1),
        )
  },
})
