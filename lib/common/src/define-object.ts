export interface Descriptor<T> {
  configurable?: boolean;
  enumerable?: boolean;
  value?: T;
  writable?: boolean;
  get?(): T;
  set?(v: T): void;
}

const DESCRIPTOR_KEYS: (keyof Descriptor<unknown>)[] = ['configurable', 'enumerable', 'value', 'writable', 'get', 'set']

export function hasOwnProperty<TProp extends string | symbol | number>(obj: unknown, prop: TProp): obj is Record<TProp, unknown>  {
  return obj?.hasOwnProperty(prop)
}

export function isDescriptor<T>(obj: unknown): obj is Descriptor<T> {
  if (!obj) {
    return false
  }

  if (Object.getOwnPropertyNames(obj).some(prop => (DESCRIPTOR_KEYS as string[]).indexOf(prop) < 0)) {
    return false
  }

  if (obj.hasOwnProperty('value')) {
    return true
  }

  return (hasOwnProperty(obj, 'get') && typeof obj.get === 'function') ||
    (hasOwnProperty(obj, 'set') && typeof obj.set === 'function')
}

export type DescriptorMap<T, TProps> = {
  [TProp in keyof TProps]: Descriptor<TProps[TProp]>
} & ThisType<T>

export type ObjectInitFn = (...args: unknown[]) => unknown
export type ObjectInit<T> = Partial<T> | ObjectInitFn
export type ObjectProps<T, TInit extends ObjectInit<T>> = DescriptorMap<T, T extends Partial<T> ? Omit<T, keyof TInit> : T>

export function isObjectInit<T, TObjectInit extends ObjectInit<T>>(obj: unknown): obj is TObjectInit {
  return typeof obj === 'function' || !isObjectProps(obj)
}

export function isObjectProps<T, TInit extends ObjectInit<T>>(obj: unknown): obj is ObjectProps<T, TInit> {
  return Object.entries(obj).every(([, value]) => isDescriptor(value))
}

export function defineObject<T>(properties: DescriptorMap<T, T> & ThisType<T>): T
export function defineObject<T, TInit extends ObjectInit<T>, TProps extends ObjectProps<T, TInit>>(
  obj: TInit, properties: TProps): T
export function defineObject<T, TInit extends ObjectInit<T>, TProps extends ObjectProps<T, TInit>>(
  objOrProperties: TInit | TProps, properties?: TProps): T {
  if (isObjectProps<T, TInit>(objOrProperties)) {
    return Object.create({}, objOrProperties) as T
  }
  return Object.assign(objOrProperties, Object.create({}, properties)) as T
}
