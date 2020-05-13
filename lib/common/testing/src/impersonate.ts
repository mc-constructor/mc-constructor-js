export function impersonate<TInstance, TResult>(instance: TInstance, fn: ((this: TInstance) => TResult)): TResult {
  return fn.call(instance)
}
