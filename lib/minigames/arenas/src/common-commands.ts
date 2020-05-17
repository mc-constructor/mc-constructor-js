import { InjectionToken } from '@dandi/core'
import { Area, Coordinates } from '@ts-mc/core/types'
import { CommandRequest } from '@ts-mc/core/command'
import { GameScope, MinigameEvents } from '@ts-mc/minigames'

import { Arena } from './arena'
import { localToken } from './local-token'
import { Constructor } from '@dandi/common'
import { ClassFactoryProviderFn } from '@ts-mc/common'

export interface CommonCommandsConstructor<TCommon extends CommonCommands> extends Constructor<TCommon> {
  provide: ClassFactoryProviderFn<TCommon>
}

export interface CommonCommands {
  readonly center: Coordinates
  readonly spawnOffsetFromFloor: Coordinates
  readonly spawnBlacklistOffset: Area

  readonly holdingSize: number
  readonly holdingCenter: Coordinates
  readonly holdingArea: Area

  movePlayersToHolding(): CommandRequest
  movePlayersToArena(arena: Arena<MinigameEvents>): CommandRequest
  initHoldingArea(): CommandRequest
  removeHoldingArea(): CommandRequest
  teleportPlayersToRandomWithin(areas: Area[], facing?: Coordinates | string): CommandRequest
  teleportPlayer(target: string, loc: Coordinates, facing?: Coordinates | string): CommandRequest
  getRandomLocation(areas: Area[], blacklist: Area[]): Coordinates
}

export const CommonCommands: InjectionToken<CommonCommands> = localToken.opinionated('CommonCommands', {
  multi: false,
  restrictScope: GameScope,
})
