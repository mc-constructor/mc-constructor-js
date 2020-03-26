import { fill, set } from '../../cmd'
import { loc, Location } from '../../types'
import { setupCodslap } from './codslap'

const GROUND_DEPTH = 3
const TOPSOIL = GROUND_DEPTH + 1
const AIR_START = TOPSOIL + 1

const INIT = [
  'time set day',
  'weather clear',
  'gamerule doWeatherCycle false',
  'gamerule doDaylightCycle false',
  ...fill(loc(-50, 0, -50), loc(50, 0, 50), 'bedrock'),
  ...fill(loc(-50, 1, -50), loc(50, GROUND_DEPTH, 50), 'dirt'),
  ...fill(loc(-50, TOPSOIL, -50), loc(50, TOPSOIL, 50), 'grass_block'),
  ...fill(loc(-50, AIR_START, -50), loc(50, AIR_START+2, 50), 'air'),
  ...fill(loc(-50, AIR_START + 3, -50), loc(50, AIR_START+ 5, 50), 'air'),
]

function box(start: Location, end: Location, wallBlockId): string[] {
    const [sx, sy, sz] = start
    const [ex, ey, ez] = end
  return [
    ...fill(loc(sx, sy, sz), loc(sx, ey, sz), wallBlockId), // nw
    ...fill(loc(ex, sy, sz), loc(ex, ey, sz), wallBlockId), // ne
    ...fill(loc(sx, sy, ez), loc(sx, ey, ez), wallBlockId), // sw
    ...fill(loc(ex, sy, ez), loc(ex, ey, ez), wallBlockId), // se

    ...fill(loc(sx, sy, sz.plus(1)), loc(sx, ey, ez.minus(1)), wallBlockId), // nw -> sw = west
    ...fill(loc(ex, sy, sz.plus(1)), loc(ex, ey, ez.minus(1)), wallBlockId), // ne -> se = east

    ...fill(loc(sx.plus(1), sy, sz), loc(ex.minus(1), ey, sz), wallBlockId), // nw -> ne = north
    ...fill(loc(sx.plus(1), sy, ez), loc(ex.minus(1), ey, ez), wallBlockId), // sw -> se = south

    ...fill(loc(sx, sy, sz), loc(ex, sy, ez), wallBlockId), // floor
    ...fill(loc(sx, ey, sz), loc(ex, ey, ez), wallBlockId), // ceiling
  ]
}

export function test(): string[] {
  const result = [...INIT];

  // result.push(...box(loc(-10, AIR_START, -10), loc(10, AIR_START + 10, 10), 'oak_wood'))
  // result.push(...fill(loc(-10, AIR_START, -10), loc(10, AIR_START + 15, 10), 'air'))
  // result.push(
  //   commandBlock('summon sheep', loc(0, AIR_START, 0)),
  // )
  // result.push(summonPassenger(RANDOM_ANIMAL, loc(0,AIR_START, 0), 50))
  result.push(...setupCodslap(loc(0, AIR_START, 0)))

  return result
}
