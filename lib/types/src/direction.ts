import { Axis, Coordinates } from './coordinates'

export enum Direction {
  north = 'north',
  south = 'south',
  east = 'east',
  west = 'west',
  up = 'up',
  down = 'down',
}

/**
 * {@param target} and {@param from} must share 2 axis
 *
 * @param target
 * @param from
 */
export function facing(target: Coordinates, from: Coordinates): Direction {
  let onAxis: Axis
  for (const axis of Axis) {
    if (target[axis].valueOf() !== from[axis].valueOf()) {
      if (onAxis) {
        throw new Error('The target and from coordinates must share two axis')
      }
    }
    onAxis = axis
  }

  if (!onAxis) {
    return Direction.north
  }

  switch (onAxis) {
    case 'x': return target[onAxis] > from[onAxis] ? Direction.east : Direction.west
    case 'y': return target[onAxis] > from[onAxis] ? Direction.up : Direction.down
    case 'z': return target[onAxis] > from[onAxis] ? Direction.south: Direction.north
  }
}
