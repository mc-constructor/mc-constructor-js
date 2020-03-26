import { Location } from '../../types'

import { BlockExtras } from './block-extras'
import { SimpleCommand } from './command'

export class BlockState extends BlockExtras {
  protected readonly keyValueSeparator: string = '='
  protected readonly prefix: string = '['
  protected readonly suffix: string = ']'
}

export class BlockData extends BlockExtras {
  protected readonly keyValueSeparator: string = ':'
  protected readonly prefix = '{'
  protected readonly suffix = '}'
}

export class SetBlockCommand<TBlockState extends BlockState, TBlockData extends BlockData> extends SimpleCommand {

  protected readonly state: TBlockState
  protected readonly data: TBlockData
  protected readonly command: string = 'setblock'

  protected constructor(
    BlockState: new () => TBlockState,
    BlockData: new () => TBlockData,
    public location: Location,
    public type: string
  ) {
    super()
    this.state = new BlockState()
    this.data = new BlockData()
  }

  public formatArgs(): string {
    return `${this.location} ${this.type}${this.state}${this.data}`
  }

  protected parseResponse(responseText: string): void {
    return
  }
}
