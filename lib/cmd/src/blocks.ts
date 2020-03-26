import { Coordinate, Location, LocationCoordinateIndex } from '../../types'

const MAX_FILL_VOLUME = 32768

export function getVolume(start: Location, end: Location): number {
  // TODO: use reduce?
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const l = Math.abs(sx - ex) + 1
  const w = Math.abs(sy - ey) + 1
  const d = Math.abs(sz - ez) + 1
  return l * w * d
}

function formatFill(start: Location, end: Location, blockId: string): string {
  return `fill ${start.join(' ')} ${end.join(' ')} ${blockId}`
}

export function fill(start: Location, end: Location, blockId: string): string[] {
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const volume = getVolume(start, end)

  if (volume < MAX_FILL_VOLUME) {
    return [formatFill(start, end, blockId)]
  }

  // (l - dL) * (w - dW) * (d - dD) = MAX_FILL_VOLUME

  const dX = Math.abs(sx - ex) + 1
  const dY = Math.abs(sy - ey) + 1
  const dZ = Math.abs(sz - ez) + 1

  const dims: { val: number, index: LocationCoordinateIndex }[] = [
    { val: dX, index: 0 as LocationCoordinateIndex },
    { val: dY, index: 1 as LocationCoordinateIndex },
    { val: dZ, index: 2 as LocationCoordinateIndex },
  ].sort((a, b) => b.val - a.val)
  console.log('DIMS', dims)
  const selectedDim = dims[0]
  const numCommands = Math.ceil(volume / MAX_FILL_VOLUME)
  let increment = Math.floor(selectedDim.val / numCommands)
  console.log('info', { numCommands, increment })

  const dimIx: LocationCoordinateIndex = selectedDim.index
  const dimStart = start[dimIx]
  const dimEnd = end[dimIx]

  const incStart = dimStart < dimEnd ? start : end
  const incEnd = dimStart > dimEnd ? start : end
  const dimIncEnd = incEnd[dimIx]
  const result = []

  let step = incStart.clone()
  let lastStep = incStart
  console.log('incrementing', incStart, 'to', incEnd)
  while (step[dimIx] < incEnd[dimIx]) {
    const nextInc = step[dimIx] + increment > dimIncEnd ? dimIncEnd : step[dimIx].plus(increment)
    console.log('step', nextInc, step[dimIx], incEnd[dimIx])
    step = step.modify(dimIx, nextInc)
    result.push(formatFill(lastStep, step, blockId))
    lastStep = step
  }

  console.log('commands', result)

  return result

}

export function set(loc: Location, blockId: string): string {
  return `setblock ${loc.join(' ')} ${blockId}`
}
