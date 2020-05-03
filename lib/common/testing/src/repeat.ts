import { range } from '../..'

export function repeat(count: number, fn: ((num?: number) => void)): void {
  range(count).forEach(fn)
}
