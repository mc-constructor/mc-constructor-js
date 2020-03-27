import { Coordinates } from '../../types'

export enum AnimalType {
  cat = 'cat',
  chicken = 'chicken',
  cow = 'cow',
  fox = 'fox',
  horse = 'horse',
  llama = 'llama',
  parrot = 'parrot',
  pig = 'pig',
  polarBear = 'polar_bear',
  ocelot = 'ocelot',
  sheep = 'sheep',
  wolf = 'wolf',
}
const ANIMALS = Object.values(AnimalType)

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) ) + min
}

export const RANDOM_ANIMAL = () => ANIMALS[randomInt(0, ANIMALS.length - 1)]

export type RandomIdFn = () => string

export function getId(id: string | RandomIdFn): string {
  return typeof id === 'string' ? id : id()
}

export function passengers(id: string | RandomIdFn, depth: number = 0): string {
  if (depth) {
    const passengersStr = passengers(id, depth - 1)
    return `Passengers:[{id:${getId(id)}${passengersStr ? ',' : ''}${passengersStr}}]`
  }
  return ''
}

export function summonPassenger(id: string | RandomIdFn, loc: Coordinates, depth: number = 0): string {
  const passengersStr = passengers(id, depth)
  return `summon ${getId(id)} ${loc}${passengersStr ? ` {${passengersStr}}` : ''}`
}
