import { Block } from '../../types'

import { SimpleCommand } from './command'
import { BlockState } from './block-state'
import { BlockData } from './block-data'

export abstract class BlockCommand<TBlock extends Block> extends SimpleCommand {
  protected constructor(
    public readonly block: TBlock,
    public readonly state: BlockState[TBlock],
    public readonly data: BlockData[TBlock],
  ) {
    super()
  }
}
