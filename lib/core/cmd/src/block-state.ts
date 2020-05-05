import { Block } from '@ts-mc/core/types'

import { BlockStateBase } from './block-extras'
import { CommandBlockState } from './command-block'

type BlockStateMap = {
  [Block.chainCommandBlock]: CommandBlockState
  [Block.commandBlock]: CommandBlockState
  [Block.repeatingCommandBlock]: CommandBlockState
}

export type BlockState = {
  [TBlock in Block]: TBlock extends keyof BlockStateMap ? BlockStateMap[TBlock] : BlockStateBase
}

type BlockStateCustomConstructorMap = {
  [TBlock in keyof BlockStateMap]: new () => BlockStateMap[TBlock]
}

const BlockStateMap: BlockStateCustomConstructorMap = {
  [Block.chainCommandBlock]: CommandBlockState,
  [Block.commandBlock]: CommandBlockState,
  [Block.repeatingCommandBlock]: CommandBlockState,
}

type BlockStateConstructorMap = {
  [TBlock in keyof BlockState]: TBlock extends keyof BlockStateCustomConstructorMap ? BlockStateCustomConstructorMap[TBlock] : new () => BlockState[TBlock]
}

function blockHasCustomBlockStateConstructor(block: Block): block is keyof BlockStateMap {
  return !!BlockStateMap[block as keyof BlockStateMap]
}

export const BlockState: BlockStateConstructorMap = Object.values(Block).reduce((result, block) => {
  if (blockHasCustomBlockStateConstructor(block)) {
    result[block] = BlockStateMap[block]
  } else {
    result[block] = BlockStateBase
  }
  return result
}, {} as BlockStateConstructorMap)
