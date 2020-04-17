const LAZY = Symbol.for('__lazy_properties__')

function lazyClassDecorator(target: Function): void {
  const lazyProps = target[LAZY]

  if (!lazyProps) {
    throw new Error(`No lazy properties have been defined on class ${target.name}`)
  }

  for (const propertyKey of lazyProps) {
    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, propertyKey)
    if (!descriptor?.get) {
      throw new Error(`No get accessor for lazy property ${target.name}.${propertyKey}`)
    }
    if (descriptor.set) {
      throw new Error(`@Lazy() cannot be used with a set accessor (on ${target.name}.${propertyKey})`)
    }
    const lazy = Symbol.for(`__lazy_${propertyKey.toString()}`)
    function lazyGet(): any {
      if (!this[lazy]) {
        this[lazy] = descriptor.get.bind(this)()
      }
      return this[lazy]
    }
    Object.defineProperty(target.prototype, propertyKey, {
      get: lazyGet,
    })
  }
}

function lazyPropertyDecorator(target: Object, propertyKey: string | symbol): void {
  const ctr = target.constructor
  const lazyProps = ctr[LAZY] || new Set<string | symbol>()
  lazyProps.add(propertyKey)
  ctr[LAZY] = lazyProps
}

export function Lazy(): PropertyDecorator & ClassDecorator {
  return function lazyDecorator(target: Object | Function, propertyKey?: string | symbol): void {
    if (propertyKey) {
      lazyPropertyDecorator(target, propertyKey)
    } else {
      lazyClassDecorator(target as Function)
    }
  }
}
