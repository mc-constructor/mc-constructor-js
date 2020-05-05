import { CommandRequest, MultiCommandRequest } from '@ts-mc/core/command'
import { Block, Coordinates, CoordinatesAxisIndex } from '@ts-mc/core/types'

import { BlockCommand } from './block-command'
import { BlockData } from './block-data'
import { BlockState } from './block-state'

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
  // protected readonly allowedErrorKeys = ['commands.fill.toobig']
  protected readonly allowedErrorKeys = ['commands.fill.failed']

  constructor(
    block: TBlock,
    state: BlockState[TBlock],
    data: BlockData[TBlock],
    public readonly method: FillMethod,
    public readonly start: Coordinates,
    public readonly end: Coordinates) {
    super(block, state, data)

    if (getVolume(start, end, method) > MAX_FILL_VOLUME) {
      throw new Error('wtf mate')
    }
  }

  protected formatArgs(): string {
    return `${this.start} ${this.end} ${this.block}${this.state}${this.data}${this.method ? ' ' : ''}${this.method || ''}`;
  }

}

interface FillDimension {
  val: number
  index: CoordinatesAxisIndex
  volPer: number
  increment: number
  fillPerIncrement: number
}

export class FillCommand<TBlock extends Block> extends MultiCommandRequest {

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

  private makeIncrement(start: Coordinates, end: Coordinates): CommandRequest {
    return new FillIncrementCommand(this.block, this.state, this.data, this.method, start, end)
  }

  public compile(): CommandRequest[] {
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

    const makeDim = (val: number, index: CoordinatesAxisIndex): FillDimension => {
      const start = this.start
      const end = this.end.modify(index, this.start[index] + 1)
      const volPer = getVolume(start, end, this.method)
      const increment = Math.floor(MAX_FILL_VOLUME / volPer)
      const fillPerIncrement = volPer * increment
      return {
        val,
        index,
        volPer,
        increment,
        fillPerIncrement,
      }
    }

    const dims: FillDimension[] = [
      makeDim(dX, 0),
      makeDim(dY, 1),
      makeDim(dZ, 2),
    ].sort((a, b) => b.fillPerIncrement - a.fillPerIncrement)
    const selectedDim = dims[0]

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
      const nextInc = stepStart[dimIx] + selectedDim.increment > dimIncEnd ? dimIncEnd : stepStart[dimIx].plus(selectedDim.increment)
      stepStart = stepStart.modify(dimIx, nextInc)
      result.push(this.makeIncrement(stepStart, stepEnd))
      stepEnd = stepEnd.modify(dimIx, nextInc + 1)
    }

    return result
  }
}
