import { Constructor } from '@dandi/common'
import { InjectionOptions, Registerable } from '@dandi/core'

export interface SubcassFactoryProviderFn<TSuper> {
  <TImpl extends TSuper>(implClass: Constructor<TImpl>): Registerable[]
}

export function subclassFactoryProvider<TSuper>(superClass: Constructor<TSuper>, options?: InjectionOptions): SubcassFactoryProviderFn<TSuper> {
  return <TImpl extends TSuper>(implClass: Constructor<TImpl>): Registerable[] => [
    implClass,
    Object.assign({
      provide: superClass,
      useFactory: (impl: TImpl) => impl,
      deps: [implClass],
    }, options)
  ]
}
