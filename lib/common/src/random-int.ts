export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) ) + min
}

export function randomIntGenerator(min: number, max: number): () => number {
  return randomInt.bind(undefined, min, max)
}
