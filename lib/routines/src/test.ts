import { fill, set } from '../../cmd'
import { loc, Location } from '../../types'

const GROUND_DEPTH = 3
const TOPSOIL = GROUND_DEPTH + 1
const AIR_START = TOPSOIL + 1

const INIT = [
  'time set day',
  'weather clear',
  'gamerule doWeatherCycle false',
  'gamerule doDaylightCycle false',
  fill(loc(-50, 0, -50), loc(50, 0, 50), 'bedrock'),
  fill(loc(-50, 1, -50), loc(50, GROUND_DEPTH, 50), 'dirt'),
  fill(loc(-50, TOPSOIL, -50), loc(50, TOPSOIL, 50), 'grass_block'),
  fill(loc(-50, AIR_START, -50), loc(50, AIR_START+2, 50), 'air'),
  fill(loc(-50, AIR_START + 3, -50), loc(50, AIR_START+ 5, 50), 'air'),
]

function box(start: Location, end: Location, wallBlockId): string[] {
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  return [
    fill([sx, sy, sz], [sx, ey, sz], 'redstone_block'), // nw
    fill([sx, sy, ez], [sx, ey, ez], 'redstone_block'), // sw
    fill([sx, sy, sz.plus(1)], [sx, ey, ez.minus(1)], wallBlockId), // nw -> sw = west
    fill([ex, sy, sz], [ex, ey, sz], 'redstone_block'), // ne
    fill([ex, sy, ez], [ex, ey, ez], 'redstone_block'), // se
    fill([ex, sy, sz.plus(1)], [ex, ey, ez.minus(1)], wallBlockId), // ne -> se = east
  ]
}

export function test(): string[] {
  const result = [...INIT];

  result.push(...box(loc(-10, AIR_START, -10), loc(10, AIR_START + 4, 10), 'oak_wood'))

  return result
}
