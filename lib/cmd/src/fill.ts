import { Block, Coordinates, CoordinatesAxisIndex } from '../../types'

import { BlockCommand } from './block-command'
import { BlockData } from './block-data'
import { BlockState } from './block-state'
import { Command, MultiCommand } from './command'

const MAX_FILL_VOLUME = 32768

// TODO: move this elsewhere
export function getVolume(start: Coordinates, end: Coordinates, method: FillMethod): number {
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const l = Math.abs(sx - ex) + 1
  const w = Math.abs(sy - ey) + 1
  const d = Math.abs(sz - ez) + 1
  const totalVolume = l * w * d
  if (method === FillMethod.hollow || method === FillMethod.outline) {
    return totalVolume - (
      (l - 1) * (w - 1) * (d - 1)
    )
  }
  return totalVolume
}

export enum FillMethod {
  destroy = 'destroy',
  hollow = 'hollow',
  keep = 'keep',
  outline = 'outline',
  replace = 'replace',
}

class FillIncrementCommand<TBlock extends Block> extends BlockCommand<Block> {
  protected readonly command: string = 'fill'
  protected readonly allowedErrorKeys = ['commands.fill.toobig']

  constructor(
    block: TBlock,
    state: BlockState[TBlock],
    data: BlockData[TBlock],
    public readonly method: FillMethod,
    public readonly start: Coordinates,
    public readonly end: Coordinates) {
    super(block, state, data)
  }

  protected formatArgs(): string {
    return `${this.start} ${this.end} ${this.block}${this.state}${this.data}${this.method ? ' ' : ''}${this.method || ''}`;
  }

}

export class FillCommand<TBlock extends Block> extends MultiCommand {

  protected readonly parallel = true

  constructor(
    public readonly block: TBlock,
    public readonly state: BlockState[TBlock],
    public readonly data: BlockData[TBlock],
    public readonly method: FillMethod,
    public readonly start: Coordinates,
    public readonly end: Coordinates) {
    super()
  }

  private makeIncrement(start: Coordinates, end: Coordinates): Command {
    return new FillIncrementCommand(this.block, this.state, this.data, this.method, start, end)
  }

  public compile(): Command[] {
    const [sx, sy, sz] = this.start
    const [ex, ey, ez] = this.end
    const volume = getVolume(this.start, this.end, this.method)

    if (volume < MAX_FILL_VOLUME) {
      return [this.makeIncrement(this.start, this.end)]
    }

    // FIXME: calculate correct volume when using these methods
    if (this.method === FillMethod.hollow || this.method === FillMethod.outline) {
      throw new Error(
        `FillMethod '${this.method}' cannot be used when filling a volume larger than ${MAX_FILL_VOLUME} (requested volume ${volume})`,
      )
    }

    const dX = Math.abs(sx - ex) + 1
    const dY = Math.abs(sy - ey) + 1
    const dZ = Math.abs(sz - ez) + 1

    const dims: { val: number, index: CoordinatesAxisIndex }[] = [
      { val: dX, index: 0 as CoordinatesAxisIndex },
      { val: dY, index: 1 as CoordinatesAxisIndex },
      { val: dZ, index: 2 as CoordinatesAxisIndex },
    ].sort((a, b) => b.val - a.val)
    const selectedDim = dims[0]
    const numCommands = Math.ceil(volume / MAX_FILL_VOLUME)
    let increment = Math.floor(selectedDim.val / numCommands)

    const dimIx: CoordinatesAxisIndex = selectedDim.index
    const dimStart = this.start[dimIx]
    const dimEnd = this.end[dimIx]

    const incStart = dimStart < dimEnd ? this.start : this.end
    const incEnd = dimStart > dimEnd ? this.start : this.end
    const dimIncEnd = incEnd[dimIx]
    const result = []

    let stepStart = incStart.clone()
    let stepEnd = incEnd.modify(dimIx, incStart[dimIx])

    while (stepStart[dimIx] < dimIncEnd) {
      const nextInc = stepStart[dimIx] + increment > dimIncEnd ? dimIncEnd : stepStart[dimIx].plus(increment)
      stepStart = stepStart.modify(dimIx, nextInc)
      result.push(this.makeIncrement(stepStart, stepEnd))
      stepEnd = stepEnd.modify(dimIx, nextInc + 1)
    }

    return result
  }

  protected compileResponse(cmdResponses: any[]): Block {
    return undefined;
  }
}
