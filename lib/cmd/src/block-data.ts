import { Block } from '../../types'

import { BlockDataBase } from './block-extras'
import { CommandBlockData } from './command-block'

type BlockDataMap = {
  [Block.chainCommandBlock]: CommandBlockData
  [Block.commandBlock]: CommandBlockData
  [Block.repeatingCommandBlock]: CommandBlockData
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
}

type BlockDataConstructorMap = {
  [TBlock in keyof BlockData]: TBlock extends keyof BlockDataCustomConstructorMap ? BlockDataCustomConstructorMap[TBlock] : new () => BlockData[TBlock]
}

export const BlockData: BlockDataConstructorMap = Object.values(Block).reduce((result, block) => {
  result[block] = BlockDataMap[block] || BlockDataBase
  return result
}, {}) as BlockDataConstructorMap
