import { CommandRequest, MultiCommandRequest } from '@ts-mc/core/command'
import { Block, Coordinates, loc } from '@ts-mc/core/types'

import { BlockState } from './block-state'
import { BlockData } from './block-data'
import { FillCommand, FillMethod } from './fill'

export class BoxCommand<
  TBlock extends Block,
  TBlockData extends BlockData[TBlock] = BlockData[TBlock],
  TBlockState extends BlockState[TBlock] = BlockState[TBlock],
> extends MultiCommandRequest {

  protected readonly parallel = true

  constructor(
    public block: TBlock,
    public readonly state: BlockState[TBlock],
    public readonly data: BlockData[TBlock],
    public readonly start: Coordinates,
    public readonly end: Coordinates
  ) {
    super()
  }

  public compile(): CommandRequest[] {
    const [sx, sy, sz] = this.start
    const [ex, ey, ez] = this.end
    const fill = (start: Coordinates, end: Coordinates) =>
      new FillCommand(this.block, this.state, this.data, FillMethod.replace, start, end)
    return [
      fill(loc(sx, sy, sz), loc(sx, ey, sz)), // nw
      fill(loc(ex, sy, sz), loc(ex, ey, sz)), // ne
      fill(loc(sx, sy, ez), loc(sx, ey, ez)), // sw
      fill(loc(ex, sy, ez), loc(ex, ey, ez)), // se

      fill(loc(sx, sy, sz.plus(1)), loc(sx, ey, ez.minus(1))), // nw -> sw = west
      fill(loc(ex, sy, sz.plus(1)), loc(ex, ey, ez.minus(1))), // ne -> se = east

      fill(loc(sx.plus(1), sy, sz), loc(ex.minus(1), ey, sz)), // nw -> ne = north
      fill(loc(sx.plus(1), sy, ez), loc(ex.minus(1), ey, ez)), // sw -> se = south

      fill(loc(sx, sy, sz), loc(ex, sy, ez)), // floor
      fill(loc(sx, ey, sz), loc(ex, ey, ez)), // ceiling
    ]
  }

  protected compileResponse(cmdResponses: any[]): any {
    return undefined;
  }
}
