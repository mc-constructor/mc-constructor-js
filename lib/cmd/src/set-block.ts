import { Block, Coordinates } from '../../types'

import { BackupBlockCommand } from './backup-block'
import { BlockCommand } from './block-command'
import { BlockData } from './block-data'
import { BlockState } from './block-state'

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
    return `${this.loc} ${this.block}${this.state._generate(this)}${this.data._generate(this)}`
  }

  public backup(): BackupBlockCommand<TBlock> {
    return new BackupBlockCommand(this)
  }

  public toString(): string {
    return `"${super.toString().replace(/"/g, '\\"')}"`
  }

  protected parseResponse(responseText: string): string {
    return responseText
  }
}
