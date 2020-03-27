import { Block, Coordinates } from '../../types'

import { BlockCommand } from './block-command'
import { BlockData } from './block-data'
import { BlockState } from './block-state'
import { BackupBlockCommand } from './backup-block'

export class SetBlockCommand<TBlock extends Block> extends BlockCommand<TBlock> {

  protected readonly command: string = 'setblock'

  public constructor(
    block: TBlock,
    state: BlockState[TBlock],
    data: BlockData[TBlock],
    public readonly loc: Coordinates,
  ) {
    super(block, state, data)
  }

  public formatArgs(): string {
    return `${this.loc} ${this.block}${this.state}${this.data}`
  }

  public backup(): BackupBlockCommand<TBlock> {
    return new BackupBlockCommand(this)
  }

  protected parseResponse(responseText: string): void {
    return
  }
}
