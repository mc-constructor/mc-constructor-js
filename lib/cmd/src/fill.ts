import { Block, Coordinates, CoordinatesAxisIndex } from '../../types'

import { BlockCommand } from './block-command'
import { BlockData } from './block-data'
import { BlockState } from './block-state'
import { Command, ComplexCommand } from './command'

const MAX_FILL_VOLUME = 32768

// TODO: move this elsewhere
export function getVolume(start: Coordinates, end: Coordinates): number {
  // TODO: use reduce?
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const l = Math.abs(sx - ex) + 1
  const w = Math.abs(sy - ey) + 1
  const d = Math.abs(sz - ez) + 1
  return l * w * d
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

export class FillCommand<TBlock extends Block> extends ComplexCommand {

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
    const volume = getVolume(this.start, this.end)

    if (volume < MAX_FILL_VOLUME) {
      return [this.makeIncrement(this.start, this.end)]
    }

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

    let step = incStart.clone()
    let lastStep = incStart

    while (step[dimIx] < incEnd[dimIx]) {
      const nextInc = step[dimIx] + increment > dimIncEnd ? dimIncEnd : step[dimIx].plus(increment)
      step = step.modify(dimIx, nextInc)
      result.push(this.makeIncrement(lastStep, step))
      lastStep = step
    }

    return result
  }

  protected compileResponse(cmdResponses: any[]): Block {
    return undefined;
  }
}
