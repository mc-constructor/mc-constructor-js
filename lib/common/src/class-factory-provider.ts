import { Constructor } from '@dandi/common'
import { InjectionOptions, InjectionToken, Registerable } from '@dandi/core'

export interface ClassFactoryProviderFn<TProvide> {
  <TImpl extends TProvide>(this: Constructor<TImpl>): Registerable[]
}

export function classFactoryProvider<TProvide>(provide: InjectionToken<TProvide>, options?: InjectionOptions): ClassFactoryProviderFn<TProvide> {
  return function classFactoryProviderFn<TImpl extends TProvide>(this: Constructor<TImpl>): Registerable[] {
    return [
      this,
      Object.assign({
        provide,
        useFactory: (impl: TImpl) => impl,
        deps: [this],
      }, options)
    ]
  }
}
