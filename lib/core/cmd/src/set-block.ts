import { Block, Coordinates } from '@ts-mc/core/types'

import { BackupBlockCommand } from './backup-block'
import { BlockCommand } from './block-command'
import { BlockData } from './block-data'
import { BlockState } from './block-state'

export class SetBlockCommand<TBlock extends Block = Block> extends BlockCommand<TBlock> {

  // public readonly allowedErrorKeys = ['commands.setblock.failed']

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
    return `${this.loc} ${this.block}${this.state._generate(this)}${this.data._generate(this)}`
  }

  public backup(): BackupBlockCommand<TBlock> {
    return new BackupBlockCommand(this)
  }

  public toString(): string {
    return `"${super.toString().replace(/"/g, '\\"')}"`
  }
}
