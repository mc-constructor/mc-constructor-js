import { HookHandlerArgs } from '@ts-mc/minigames/behaviors'

export type NumberFn = () => number

export interface SummonCountConfig {
  base: number | NumberFn
  playerMultiplier?: number | NumberFn
  playerBonus?: number | NumberFn
  limit?: number | NumberFn
}

export interface SummonCountFn {
  (args: HookHandlerArgs<any>): number
}

export type SummonCount = SummonCountConfig | SummonCountFn | number
