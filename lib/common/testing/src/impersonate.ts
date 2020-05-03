export function impersonate<T>(instance: T, fn: ((this: T) => void)): void {
  return fn.call(instance)
}
