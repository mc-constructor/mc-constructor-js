import { SimpleCommandRequest } from '@ts-mc/core/command'
import { Block } from '@ts-mc/core/types'

import { BlockState } from './block-state'
import { BlockData } from './block-data'

export abstract class BlockCommand<TBlock extends Block = Block> extends SimpleCommandRequest {

  protected constructor(
    public readonly block: TBlock,
    public readonly state: BlockState[TBlock],
    public readonly data: BlockData[TBlock],
  ) {
    super()
  }
}
