import { Block } from '@ts-mc/core/types'

import { BlockDataBase } from './block-extras'
import { TntBlockData } from './blocks/tnt'
import { CommandBlockData } from './command-block'

type BlockDataMap = {
  [Block.chainCommandBlock]: CommandBlockData
  [Block.commandBlock]: CommandBlockData
  [Block.repeatingCommandBlock]: CommandBlockData
  [Block.tnt]: TntBlockData,
}

export type BlockData = {
  [TBlock in Block]: TBlock extends keyof BlockDataMap ? BlockDataMap[TBlock] : BlockDataBase
}

type BlockDataCustomConstructorMap = {
  [TBlock in keyof BlockDataMap]: new () => BlockDataMap[TBlock]
}

const BlockDataMap: BlockDataCustomConstructorMap = {
  [Block.chainCommandBlock]: CommandBlockData,
  [Block.commandBlock]: CommandBlockData,
  [Block.repeatingCommandBlock]: CommandBlockData,
  [Block.tnt]: TntBlockData,
}

type BlockDataConstructorMap = {
  [TBlock in keyof BlockData]: TBlock extends keyof BlockDataCustomConstructorMap ? BlockDataCustomConstructorMap[TBlock] : new () => BlockData[TBlock]
}

function blockHasCustomBlockDataConstructor(block: Block): block is keyof BlockDataMap {
  return !!BlockDataMap[block as keyof BlockDataMap]
}

export const BlockData: BlockDataConstructorMap = Object.values(Block).reduce((result, block) => {
  if (blockHasCustomBlockDataConstructor(block)) {
    result[block] = BlockDataMap[block] as any
  } else {
    result[block] = BlockDataBase
  }
  return result
}, {} as BlockDataConstructorMap)
