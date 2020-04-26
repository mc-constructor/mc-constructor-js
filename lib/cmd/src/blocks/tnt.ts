import { Ticks } from '../../../types'

import { BlockDataBase } from '../block-extras'

export class TntBlockData extends BlockDataBase {
  public fuse(fuse: Ticks | number): this {
    return this.setData('Fuse', fuse.valueOf())
  }
}
